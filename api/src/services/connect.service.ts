import Stripe from "stripe";
import User from "../models/User";
import { AppError } from "../utils/AppError";

const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:3003";

let stripeClient: Stripe | null = null;

function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new AppError("STRIPE_SECRET_KEY is not configured", 500);
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function toStripeAppError(error: unknown, fallback: string) {
  if (error instanceof Stripe.errors.StripeError) {
    const message = error.message || fallback;
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return AppError.badRequest(message);
    }
    return new AppError(message, error.statusCode || 500);
  }
  if (error instanceof Error) {
    return new AppError(error.message || fallback, 500);
  }
  return new AppError(fallback, 500);
}

function toConnectStatus(user: any) {
  const stripeConnect = user?.stripeConnect ?? {};
  return {
    stripeConnectAccountId: stripeConnect.accountId ?? null,
    stripeConnectOnboardingComplete: Boolean(stripeConnect.onboardingComplete),
    stripeConnectChargesEnabled: Boolean(stripeConnect.chargesEnabled),
    stripeConnectPayoutsEnabled: Boolean(stripeConnect.payoutsEnabled),
    stripeConnectDetailsSubmitted: Boolean(stripeConnect.detailsSubmitted),
  };
}

async function assertOrganizerAccess(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");
  if (user.role !== "organizer") {
    throw AppError.forbidden("Organizer account required");
  }
  return user;
}

async function ensureConnectedAccount(user: any) {
  const stripe = getStripe();
  const existingAccountId = user.stripeConnect?.accountId;

  if (existingAccountId) {
    try {
      return await stripe.accounts.retrieve(existingAccountId);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === "resource_missing"
      ) {
        user.stripeConnect = {
          accountId: null,
          onboardingComplete: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
        };
        await user.save();
      } else {
        throw toStripeAppError(error, "Failed to retrieve Stripe account");
      }
    }
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        userId: user._id.toString(),
      },
    });

    user.stripeConnect = {
      accountId: account.id,
      onboardingComplete: false,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    };
    await user.save();
    return account;
  } catch (error) {
    throw toStripeAppError(error, "Failed to create Stripe Connect account");
  }
}

export async function createOrRetrieveConnectAccount(userId: string) {
  const user = await assertOrganizerAccess(userId);
  const account = await ensureConnectedAccount(user);
  await syncConnectFromStripeAccount(account);
  const refreshed = await User.findById(userId).lean();

  return {
    accountId: account.id,
    status: toConnectStatus(refreshed),
  };
}

export async function createOnboardingLink(userId: string) {
  const user = await assertOrganizerAccess(userId);
  const stripe = getStripe();

  const existingAccount = await ensureConnectedAccount(user);
  let account = existingAccount;

  // If a stale non-Express account was linked previously, self-heal by creating
  // a fresh Express account so onboarding links can be generated reliably.
  if (account.type !== "express") {
    user.stripeConnect = {
      accountId: null,
      onboardingComplete: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
    await user.save();
    account = await ensureConnectedAccount(user);
  }

  let accountLink: Stripe.AccountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account: account.id,
      type: "account_onboarding",
      refresh_url: `${ADMIN_URL}/dashboard`,
      return_url: `${ADMIN_URL}/dashboard`,
    });
  } catch (error) {
    // If onboarding link cannot be generated for current state, provide a safe
    // fallback to Stripe Connect dashboard instead of hard failing for organizers.
    if (error instanceof Stripe.errors.StripeError) {
      try {
        if (account.type === "express") {
          const loginLink = await stripe.accounts.createLoginLink(account.id);
          return { url: loginLink.url, expiresAt: 0 };
        }
      } catch {
        // fall through to generic dashboard fallback
      }

      return {
        url: `https://dashboard.stripe.com/connect/accounts/${account.id}`,
        expiresAt: 0,
      };
    }

    throw toStripeAppError(error, "Failed to create Stripe onboarding link");
  }

  return { url: accountLink.url, expiresAt: accountLink.expires_at };
}

export async function getConnectStatus(userId: string) {
  const user = await assertOrganizerAccess(userId);
  if (!user.stripeConnect?.accountId) {
    return {
      ...toConnectStatus(user),
      requirementsCurrentlyDue: [],
    };
  }

  const stripe = getStripe();
  let account: Stripe.Account;
  try {
    account = await stripe.accounts.retrieve(user.stripeConnect.accountId);
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code === "resource_missing"
    ) {
      user.stripeConnect = {
        accountId: null,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
      await user.save();
      return {
        ...toConnectStatus(user),
        requirementsCurrentlyDue: [],
      };
    }
    throw toStripeAppError(error, "Failed to fetch Stripe Connect status");
  }
  await syncConnectFromStripeAccount(account);
  const refreshed = await User.findById(userId).lean();

  return {
    ...toConnectStatus(refreshed),
    requirementsCurrentlyDue: account.requirements?.currently_due ?? [],
  };
}

export async function syncConnectFromStripeAccount(account: Stripe.Account) {
  const user = await User.findOne({ "stripeConnect.accountId": account.id });
  if (!user) return;

  user.stripeConnect = {
    accountId: account.id,
    onboardingComplete: Boolean(
      account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled,
    ),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
  await user.save();
}

