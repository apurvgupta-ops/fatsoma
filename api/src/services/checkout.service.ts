import Stripe from "stripe";
import mongoose from "mongoose";
import crypto from "crypto";
import Event from "../models/Event";
import Order from "../models/Order";
import Ticket from "../models/Ticket";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";
import User from "../models/User";
import {
  sendBookingConfirmationEmail,
  sendResaleBookingEmail,
  sendTicketSoldEmail,
} from "../lib/email";
import { logPayment, logRefund } from "../lib/systemLogger";
import { createNotification } from "./notification.service";
import { syncConnectFromStripeAccount } from "./connect.service";
import { flattenTicketBatchesFromEvent } from "../domain/eventTickets";

const WEB_URL = process.env.WEB_URL || "http://localhost:3001";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new AppError("STRIPE_SECRET_KEY is not configured", 500);
    _stripe = new Stripe(key);
  }
  return _stripe;
}

function isOrganizerConnectReady(user: any) {
  if (!user || user.role !== "organizer") return true;
  const stripeConnect = user.stripeConnect ?? {};
  return Boolean(
    stripeConnect.accountId &&
      stripeConnect.onboardingComplete &&
      stripeConnect.chargesEnabled &&
      stripeConnect.payoutsEnabled &&
      stripeConnect.detailsSubmitted,
  );
}

async function getEventDestinationAccountId(event: any) {
  if (!event?.createdBy) return null;

  const owner = (await User.findById(event.createdBy)
    .select("role stripeConnect")
    .lean()) as any;
  if (!owner || owner.role !== "organizer") return null;

  if (!isOrganizerConnectReady(owner)) {
    throw AppError.badRequest(
      "Ticket checkout is unavailable until the organiser completes Stripe Connect",
    );
  }

  return owner.stripeConnect?.accountId ?? null;
}

// ── Primary checkout ────────────────────────────────────

interface CreateSessionInput {
  eventId: string;
  batchName: string;
  quantity: number;
  capturedFee: number;
  userId: string;
}

export async function createCheckoutSession(input: CreateSessionInput) {
  const { eventId, batchName, quantity, capturedFee, userId } = input;

  if (!eventId || !batchName || !quantity || capturedFee == null) {
    throw AppError.badRequest(
      "Missing required fields: eventId, batchName, quantity, capturedFee",
    );
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw AppError.badRequest("Invalid event ID");
  }

  if (quantity < 1) {
    throw AppError.badRequest("Quantity must be at least 1");
  }

  const event = (await Event.findById(eventId).lean()) as any;
  if (!event || event.status !== "published") {
    throw AppError.notFound("Event not found or not published");
  }
  const destinationAccountId = await getEventDestinationAccountId(event);

  const batch = flattenTicketBatchesFromEvent(event).find(
    (b: any) => b.name === batchName,
  );
  if (!batch) {
    throw AppError.badRequest(`Ticket batch "${batchName}" not found`);
  }

  const resaleCandidates = await ResaleListing.find({
    eventId: new mongoose.Types.ObjectId(eventId),
    status: "active",
    $or: [
      { targetTicketBatchName: batchName },
      {
        targetTicketBatchName: { $exists: false },
        originalTicketBatchName: batchName,
      },
      { targetTicketBatchName: null, originalTicketBatchName: batchName },
    ],
    sellerId: { $ne: new mongoose.Types.ObjectId(userId) },
  })
    .sort({ createdAt: 1 })
    .limit(quantity)
    .lean();

  const listedTickets = await Ticket.find({
    _id: { $in: resaleCandidates.map((listing: any) => listing.ticketId) },
    status: "listed",
  })
    .select("_id")
    .lean();
  const listedTicketIds = new Set(
    listedTickets.map((ticket: any) => ticket._id.toString()),
  );
  const matchedResaleListings = resaleCandidates.filter((listing: any) =>
    listedTicketIds.has(listing.ticketId.toString()),
  );
  const resaleListings = matchedResaleListings.slice(0, quantity) as any[];
  const resaleQuantity = resaleListings.length;
  const primaryQuantity = Math.max(quantity - resaleQuantity, 0);

  const soldCount = await Ticket.countDocuments({
    eventId: new mongoose.Types.ObjectId(eventId),
    status: { $ne: "cancelled" },
    $expr: {
      $eq: [
        { $ifNull: ["$primaryInventoryBatchName", "$ticketBatchName"] },
        batchName,
      ],
    },
  });
  const remaining = batch.quantity - soldCount;
  if (remaining < primaryQuantity) {
    throw AppError.badRequest(
      remaining <= 0
        ? `"${batchName}" tickets are sold out`
        : `Only ${remaining} "${batchName}" primary ticket(s) remaining after allocating resale`,
    );
  }

  const basePrice = batch.basePrice;
  const fee = Math.round(capturedFee * 100) / 100;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  const resaleByPrice = new Map<number, number>();
  for (const listing of resaleListings as any[]) {
    const price = Math.round(Number(listing.askingPrice || 0) * 100) / 100;
    resaleByPrice.set(price, (resaleByPrice.get(price) ?? 0) + 1);
  }
  for (const [askingPrice, count] of resaleByPrice.entries()) {
    const unitTotal = askingPrice + fee;
    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: {
          name: `${event.eventName} — ${batchName} (Resale)`,
          description: `Resale: £${askingPrice.toFixed(2)} + Booking Fee: £${fee.toFixed(2)}`,
        },
        unit_amount: Math.round(unitTotal * 100),
      },
      quantity: count,
    });
  }

  if (primaryQuantity > 0) {
    const unitTotal = basePrice + fee;
    lineItems.push({
      price_data: {
        currency: "gbp",
        product_data: {
          name: `${event.eventName} — ${batchName}`,
          description: `Base: £${basePrice.toFixed(2)} + Booking Fee: £${fee.toFixed(2)}`,
        },
        unit_amount: Math.round(unitTotal * 100),
      },
      quantity: primaryQuantity,
    });
  }

  const totalAmount = Math.round(
    lineItems.reduce((sum, item) => {
      const unitAmount = Number(item.price_data?.unit_amount ?? 0) / 100;
      const qty = Number(item.quantity ?? 0);
      return sum + unitAmount * qty;
    }, 0) * 100,
  ) / 100;
  const totalChargePence = Math.round(totalAmount * 100);
  const resaleOrganiserRevenue = Math.round(
    resaleListings.reduce(
      (sum, listing: any) =>
        sum +
        Math.max(
          Number(listing.organiserRevenue ?? 0),
          Number(listing.askingPrice || 0) -
            Number(listing.originalPurchasePrice || 0),
          0,
        ),
      0,
    ) * 100,
  ) / 100;
  const primaryOrganiserRevenue = Math.round(basePrice * primaryQuantity * 100) / 100;
  const organiserTransferAmount = Math.round(
    (primaryOrganiserRevenue + resaleOrganiserRevenue) * 100,
  );
  const platformApplicationFeePence = Math.max(
    0,
    totalChargePence - organiserTransferAmount,
  );

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        type: "primary",
        eventId,
        batchName,
        quantity: String(quantity),
        primaryQuantity: String(primaryQuantity),
        resaleQuantity: String(resaleQuantity),
        listingIds: resaleListings
          .map((listing: any) => listing._id.toString())
          .join(","),
        listingId:
          resaleListings.length > 0
            ? (resaleListings[0] as any)._id.toString()
            : "",
        basePrice: String(basePrice),
        capturedFee: String(fee),
        totalAmount: String(totalAmount),
        eventName: event.eventName,
        userId,
      },
      ...(destinationAccountId
        ? {
            payment_intent_data: {
              application_fee_amount: platformApplicationFeePence,
              transfer_data: { destination: destinationAccountId },
            },
          }
        : {}),
      success_url: `${WEB_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${WEB_URL}/events/${eventId}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : undefined;
    logPayment({
      event: "checkout_session_create_failed",
      outcome: "failure",
      type: "primary",
      userId,
      errorMessage: msg,
      errorCode: code,
      metadata: {
        eventId,
        batchName,
        quantity: String(quantity),
        primaryQuantity: String(primaryQuantity),
        resaleQuantity: String(resaleQuantity),
        organiserTransferAmount: String(organiserTransferAmount / 100),
        primaryOrganiserRevenue: String(primaryOrganiserRevenue),
        resaleOrganiserRevenue: String(resaleOrganiserRevenue),
      },
    });
    throw err;
  }

  logPayment({
    event: "checkout_session_created",
    outcome: "success",
    type: "primary",
    sessionId: session.id,
    userId,
    amountGbp: totalAmount,
    currency: "gbp",
    metadata: {
      eventId,
      batchName,
      quantity: String(quantity),
      primaryQuantity: String(primaryQuantity),
      resaleQuantity: String(resaleQuantity),
      organiserTransferAmount: String(organiserTransferAmount / 100),
      primaryOrganiserRevenue: String(primaryOrganiserRevenue),
      resaleOrganiserRevenue: String(resaleOrganiserRevenue),
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

// ── Resale checkout ─────────────────────────────────────

interface CreateResaleSessionInput {
  listingId: string;
  listingIds?: string[];
  capturedFee: number;
  userId: string;
}

export async function createResaleCheckoutSession(
  input: CreateResaleSessionInput,
) {
  const { listingId, listingIds, capturedFee, userId } = input;

  const requestedListingIds = Array.from(
    new Set((listingIds?.length ? listingIds : [listingId]).filter(Boolean)),
  );

  if (requestedListingIds.length === 0) {
    throw AppError.badRequest("At least one listing is required");
  }

  const invalidListingId = requestedListingIds.find(
    (id) => !mongoose.Types.ObjectId.isValid(id),
  );
  if (invalidListingId) {
    throw AppError.badRequest("Invalid listing ID");
  }

  const listings = await ResaleListing.find({
    _id: {
      $in: requestedListingIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
    status: "active",
  });

  if (listings.length !== requestedListingIds.length) {
    throw AppError.notFound("One or more listings are no longer active");
  }

  if (listings.some((listing) => listing.sellerId.toString() === userId)) {
    throw AppError.badRequest("You cannot buy your own listing");
  }

  const firstListing = listings[0];
  if (!firstListing) {
    throw AppError.notFound("Listing not found or no longer active");
  }

  const sameEvent = listings.every(
    (listing) => listing.eventId.toString() === firstListing.eventId.toString(),
  );
  const samePrice = listings.every(
    (listing) =>
      Math.abs(Number(listing.askingPrice) - Number(firstListing.askingPrice)) <
      0.005,
  );
  const sameTargetBatch = listings.every(
    (listing) =>
      listing.targetTicketBatchName === firstListing.targetTicketBatchName,
  );

  if (!sameEvent || !samePrice || !sameTargetBatch) {
    throw AppError.badRequest(
      "Selected listings must belong to the same event, target batch, and price tier",
    );
  }

  const tickets = await Ticket.find({
    _id: { $in: listings.map((listing) => listing.ticketId) },
    status: "listed",
  });
  if (tickets.length !== listings.length) {
    throw AppError.badRequest("One or more tickets are no longer available");
  }

  const ticketById = new Map(
    tickets.map((ticket: any) => [ticket._id.toString(), ticket]),
  );
  const firstTicket = ticketById.get(firstListing.ticketId.toString());
  if (!firstTicket) {
    throw AppError.badRequest("Ticket is no longer available");
  }

  const event = (await Event.findById(firstListing.eventId).lean()) as any;
  if (!event) throw AppError.notFound("Event not found");
  const destinationAccountId = await getEventDestinationAccountId(event);

  const fee = Math.round(capturedFee * 100) / 100;
  const unitTotal = firstListing.askingPrice + fee;
  const quantity = listings.length;
  const totalAmount = Math.round(unitTotal * quantity * 100) / 100;
  const totalChargePence = Math.round(totalAmount * 100);
  const organiserRevenueTotal = Math.round(
    listings.reduce(
      (sum, listing: any) =>
        sum +
        Math.max(
          Number(listing.organiserRevenue ?? 0),
          Number(listing.askingPrice || 0) -
            Number(listing.originalPurchasePrice || 0),
          0,
        ),
      0,
    ) * 100,
  ) / 100;
  const organiserTransferAmount = Math.round(organiserRevenueTotal * 100);
  const platformApplicationFeePence = Math.max(
    0,
    totalChargePence - organiserTransferAmount,
  );

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${event.eventName} — ${firstListing.targetTicketBatchName} (Resale)`,
              description: `Resale: £${firstListing.askingPrice.toFixed(2)} + Booking Fee: £${fee.toFixed(2)}`,
            },
            unit_amount: Math.round(unitTotal * 100),
          },
          quantity,
        },
      ],
      metadata: {
        type: "resale",
        listingId: firstListing._id.toString(),
        listingIds: listings.map((listing) => listing._id.toString()).join(","),
        quantity: String(quantity),
        eventId: firstListing.eventId.toString(),
        ticketId: firstTicket._id.toString(),
        eventName: event.eventName,
        ticketBatchName: firstListing.targetTicketBatchName,
        basePrice: String(firstListing.askingPrice),
        capturedFee: String(fee),
        totalAmount: String(totalAmount),
        userId,
      },
      ...(destinationAccountId
        ? {
            payment_intent_data: {
              application_fee_amount: platformApplicationFeePence,
              transfer_data: { destination: destinationAccountId },
            },
          }
        : {}),
      success_url: `${WEB_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${WEB_URL}/events/${firstListing.eventId}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : undefined;
    logPayment({
      event: "checkout_session_create_failed",
      outcome: "failure",
      type: "resale",
      userId,
      errorMessage: msg,
      errorCode: code,
      metadata: {
        listingIds: listings.map((listing) => listing._id.toString()).join(","),
        quantity,
        organiserTransferAmount: String(organiserTransferAmount / 100),
        organiserRevenueTotal: String(organiserRevenueTotal),
      },
    });
    throw err;
  }

  logPayment({
    event: "checkout_session_created",
    outcome: "success",
    type: "resale",
    sessionId: session.id,
    userId,
    amountGbp: totalAmount,
    currency: "gbp",
    metadata: {
      listingIds: listings.map((listing) => listing._id.toString()).join(","),
      quantity,
      organiserTransferAmount: String(organiserTransferAmount / 100),
      organiserRevenueTotal: String(organiserRevenueTotal),
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

// ── Confirm & ticket generation ─────────────────────────

async function findOrCreateOrderFromSession(
  session: Stripe.Checkout.Session,
  status: "paid" | "expired" | "failed",
) {
  let order = await Order.findOne({ stripeSessionId: session.id });
  if (order) return order;

  const meta = session.metadata ?? {};
  const isPrimary = meta.type === "primary";

  order = await Order.create({
    eventId: meta.eventId,
    userId: meta.userId || undefined,
    eventName: meta.eventName || "Unknown Event",
    ticketBatchName: isPrimary
      ? meta.batchName
      : meta.ticketBatchName || "Unknown",
    quantity: Number(meta.quantity) || 1,
    basePrice: Number(meta.basePrice) || 0,
    capturedBookingFee: Number(meta.capturedFee) || 0,
    totalAmount: Number(meta.totalAmount) || 0,
    stripeSessionId: session.id,
    stripePaymentIntentId: (session.payment_intent as string) || undefined,
    type: isPrimary ? "primary" : "resale",
    resaleListingId: meta.listingId || undefined,
    status,
    customerEmail: session.customer_details?.email ?? undefined,
    customerName: session.customer_details?.name ?? undefined,
  });

  return order;
}

function parseListingIds(meta: Record<string, string> | null | undefined) {
  if (!meta) return [] as string[];
  const raw = meta.listingIds || meta.listingId || "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && mongoose.Types.ObjectId.isValid(id));
}

function listingIdsForCheckoutOrder(
  order: { type?: string; resaleListingId?: unknown },
  meta: Record<string, string> | null | undefined,
) {
  const parsed = parseListingIds(meta);
  if (parsed.length) return parsed;
  if (order.type === "resale" && order.resaleListingId) {
    return [String(order.resaleListingId)];
  }
  return [] as string[];
}

function isSettlementRetryable(err: unknown) {
  return err instanceof AppError && err.statusCode === 503;
}

function parsePrimaryQuantity(
  meta: Record<string, string> | null | undefined,
  fallbackQuantity: number,
) {
  if (!meta?.primaryQuantity) return fallbackQuantity;
  const parsed = Number(meta.primaryQuantity);
  if (!Number.isFinite(parsed)) return fallbackQuantity;
  return Math.max(0, Math.floor(parsed));
}

export async function confirmSession(sessionId: string) {
  const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
  if (existingOrder?.status === "paid") {
    logPayment({
      event: "payment_confirm_idempotent",
      outcome: "success",
      type: "confirm",
      sessionId,
      orderId: existingOrder._id.toString(),
      paymentIntentId: existingOrder.stripePaymentIntentId,
    });
    return formatOrder(existingOrder.toObject());
  }

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logPayment({
      event: "session_retrieve_failed",
      outcome: "failure",
      type: "confirm",
      sessionId,
      errorMessage: msg,
    });
    throw err;
  }

  if (session.payment_status === "paid") {
    const order = await findOrCreateOrderFromSession(session, "paid");

    const listingIdsForTransfer = listingIdsForCheckoutOrder(
      order,
      session.metadata as Record<string, string> | undefined,
    );
    const needsResaleSettlement = listingIdsForTransfer.length > 0;

    order.stripePaymentIntentId =
      (session.payment_intent as string) || order.stripePaymentIntentId;
    order.customerEmail =
      session.customer_details?.email ?? order.customerEmail;
    order.customerName =
      session.customer_details?.name ?? order.customerName;

    if (!needsResaleSettlement && order.status !== "paid") {
      order.status = "paid";
    }
    await order.save();

    logPayment({
      event: "payment_confirmed",
      outcome: "success",
      type: "confirm",
      sessionId,
      orderId: order._id.toString(),
      paymentIntentId: order.stripePaymentIntentId as string | undefined,
      userId: order.userId?.toString(),
      amountGbp: order.totalAmount,
      metadata: { orderType: order.type },
    });

    try {
      if (order.type === "primary") {
        const primaryQuantity = parsePrimaryQuantity(
          session.metadata,
          order.quantity,
        );

        if (needsResaleSettlement) {
          await completeResaleTransfer(order, listingIdsForTransfer);
        }
        await generateTickets(order, primaryQuantity);
        if (order.userId) {
          await createNotification({
            userId: order.userId.toString(),
            type: "order_paid",
            title: "Booking Confirmed",
            body: `${order.quantity} × ${order.ticketBatchName} for ${order.eventName} has been confirmed.`,
            metadata: {
              orderId: order._id.toString(),
              eventId: order.eventId?.toString?.() ?? String(order.eventId),
              type: order.type,
              totalAmount: order.totalAmount,
            },
            dedupeKey: `order_paid:${order._id.toString()}`,
          });
        }
        if (order.customerEmail) {
          sendBookingConfirmationEmail({
            email: order.customerEmail,
            customerName: order.customerName || "",
            eventName: order.eventName,
            ticketBatchName: order.ticketBatchName,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            orderId: order._id.toString(),
          });
        }
      } else if (order.type === "resale") {
        await completeResaleTransfer(order, listingIdsForTransfer);
        if (order.userId) {
          await createNotification({
            userId: order.userId.toString(),
            type: "resale_bought",
            title: "Resale Ticket Purchased",
            body: `Your resale ticket for ${order.eventName} is confirmed.`,
            metadata: {
              orderId: order._id.toString(),
              eventId: order.eventId?.toString?.() ?? String(order.eventId),
              type: order.type,
              totalAmount: order.totalAmount,
            },
            dedupeKey: `resale_bought:${order._id.toString()}`,
          });
        }
        if (order.customerEmail) {
          sendResaleBookingEmail({
            email: order.customerEmail,
            customerName: order.customerName || "",
            eventName: order.eventName,
            ticketBatchName: order.ticketBatchName,
            totalAmount: order.totalAmount,
            orderId: order._id.toString(),
          });
        }
      }
    } catch (err) {
      if (needsResaleSettlement && isSettlementRetryable(err)) {
        order.status = "settlement_pending";
        await order.save();
      }
      throw err;
    }

    if (order.status === "settlement_pending") {
      order.status = "paid";
      await order.save();
    }

    return formatOrder(order.toObject());
  }

  if (session.status === "expired") {
    const order = await findOrCreateOrderFromSession(session, "expired");
    if (order.status !== "expired") {
      order.status = "expired";
      await order.save();
    }
    logPayment({
      event: "checkout_session_expired",
      outcome: "failure",
      type: "confirm",
      sessionId,
      orderId: order._id.toString(),
      reason: "Session expired before payment",
      metadata: { orderType: order.type },
    });
    if (order.type === "resale" && order.resaleListingId) {
      const ids = parseListingIds(session.metadata);
      if (ids.length > 0) {
        for (const listingId of ids) {
          await cancelResaleOnExpiry(new mongoose.Types.ObjectId(listingId));
        }
      } else {
        await cancelResaleOnExpiry(order.resaleListingId);
      }
    }
    return formatOrder(order.toObject());
  }

  if (existingOrder) {
    logPayment({
      event: "payment_confirm_partial",
      outcome: "pending",
      type: "confirm",
      sessionId,
      orderId: existingOrder._id.toString(),
      reason: `payment_status=${session.payment_status} status=${session.status}`,
    });
    return formatOrder(existingOrder.toObject());
  }

  logPayment({
    event: "payment_confirm_rejected",
    outcome: "failure",
    type: "confirm",
    sessionId,
    reason: "Payment session is still open or was cancelled",
    metadata: {
      payment_status: session.payment_status,
      session_status: session.status ?? "null",
    },
  });
  throw AppError.badRequest("Payment session is still open or was cancelled");
}

async function generateTickets(order: any, quantityOverride?: number) {
  const quantity = Math.max(
    0,
    Math.floor(
      Number.isFinite(quantityOverride as number)
        ? Number(quantityOverride)
        : Number(order.quantity),
    ),
  );
  if (quantity <= 0) return;

  const existingCount = await Ticket.countDocuments({ orderId: order._id });
  if (existingCount > 0) return;

  const tickets = [];
  for (let i = 0; i < quantity; i++) {
    tickets.push({
      orderId: order._id,
      eventId: order.eventId,
      userId: order.userId,
      eventName: order.eventName,
      ticketBatchName: order.ticketBatchName,
      primaryInventoryBatchName: order.ticketBatchName,
      purchasePrice: order.basePrice,
      originalPrice: order.basePrice,
      stripePaymentIntentId: order.stripePaymentIntentId || undefined,
      status: "active",
      qrCode: crypto.randomUUID(),
    });
  }
  await Ticket.insertMany(tickets);
}

type SellerRefundOutcome = "succeeded" | "pending" | "failed" | "skipped";

type SellerRefundResult = {
  outcome: SellerRefundOutcome;
  refundId?: string;
  message?: string;
};

type StripeRefund = Awaited<ReturnType<Stripe["refunds"]["retrieve"]>>;

async function pollRefundUntilTerminal(
  stripe: Stripe,
  refundId: string,
  maxAttempts = 15,
  delayMs = 400,
): Promise<StripeRefund> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const refund = await stripe.refunds.retrieve(refundId);
    if (
      refund.status === "succeeded" ||
      refund.status === "failed" ||
      refund.status === "canceled"
    ) {
      return refund;
    }
    await sleep(delayMs);
  }
  return stripe.refunds.retrieve(refundId);
}

/**
 * Refunds the original buyer (seller) on their purchase PI. Must succeed before
 * transferring the ticket to the new buyer when sellerPayout > 0.
 */
async function resolveSellerRefundForListing(
  listing: any,
  paymentIntentId: string | undefined,
  amountGbp: number,
): Promise<SellerRefundResult> {
  const listingId = listing._id.toString();
  const stripe = getStripe();

  if (amountGbp <= 0) {
    return { outcome: "skipped" };
  }

  if (!paymentIntentId) {
    listing.sellerRefundStatus = "failed";
    logRefund({
      event: "seller_refund_skipped",
      outcome: "skipped",
      listingId,
      amountGbp: amountGbp,
      reason: "No stripePaymentIntentId on original ticket",
    });
    return {
      outcome: "failed",
      message: "Original ticket has no payment reference for refund",
    };
  }

  if (listing.sellerRefundId && listing.sellerRefundStatus === "succeeded") {
    return { outcome: "succeeded", refundId: listing.sellerRefundId };
  }

  if (listing.sellerRefundId && listing.sellerRefundStatus === "pending") {
    const terminal = await pollRefundUntilTerminal(stripe, listing.sellerRefundId);
    if (terminal.status === "succeeded") {
      listing.sellerRefundStatus = "succeeded";
      return { outcome: "succeeded", refundId: listing.sellerRefundId };
    }
    listing.sellerRefundStatus =
      terminal.status === "pending" ? "pending" : "failed";
    return {
      outcome: terminal.status === "pending" ? "pending" : "failed",
      refundId: listing.sellerRefundId,
      message: `Refund status: ${terminal.status}`,
    };
  }

  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: Math.round(amountGbp * 100),
        reason: "requested_by_customer",
        metadata: {
          type: "resale_seller_payout",
          listingId,
          sellerId: listing.sellerId.toString(),
        },
      },
      { idempotencyKey: `resale_seller_refund_${listingId}` },
    );

    listing.sellerRefundId = refund.id;
    let final = refund;
    if (refund.status === "pending") {
      final = await pollRefundUntilTerminal(stripe, refund.id);
    }

    listing.sellerRefundStatus =
      final.status === "succeeded"
        ? "succeeded"
        : final.status === "pending"
          ? "pending"
          : "failed";

    logRefund({
      event: "seller_refund_created",
      outcome:
        final.status === "succeeded"
          ? "success"
          : final.status === "pending"
            ? "pending"
            : "failure",
      refundId: refund.id,
      listingId,
      paymentIntentId,
      amountGbp: amountGbp,
      ...(final.status ? { stripeStatus: final.status } : {}),
    });

    if (final.status === "succeeded") {
      return { outcome: "succeeded", refundId: refund.id };
    }
    if (final.status === "pending") {
      return {
        outcome: "pending",
        refundId: refund.id,
        message: "Seller refund still pending after wait window",
      };
    }
    return {
      outcome: "failed",
      refundId: refund.id,
      message: `Refund status: ${final.status}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : undefined;
    listing.sellerRefundStatus = "failed";
    logRefund({
      event: "seller_refund_failed",
      outcome: "failure",
      listingId,
      paymentIntentId,
      amountGbp: amountGbp,
      errorMessage: msg,
      errorCode: code,
    });
    return { outcome: "failed", message: msg };
  }
}

async function completeResaleTransfer(order: any, listingIds: string[] = []) {
  const ids = listingIds.length
    ? listingIds
    : order.resaleListingId
      ? [String(order.resaleListingId)]
      : [];

  if (!ids.length) return;

  type Prepared = {
    listing: any;
    ticket: any;
    sellerPayout: number;
    organiserRevenue: number;
    sellerPaymentIntentId: string | undefined;
  };

  const prepared: Prepared[] = [];

  for (const listingId of ids) {
    const listing = await ResaleListing.findById(listingId);
    if (!listing || listing.status === "sold") continue;

    const ticket = await Ticket.findById(listing.ticketId);
    if (!ticket) continue;

    const sellerPayout =
      Math.round(Number(listing.originalPurchasePrice) * 100) / 100;
    const organiserRevenue =
      Math.round(
        Math.max(
          Number(listing.askingPrice) - Number(listing.originalPurchasePrice),
          0,
        ) * 100,
      ) / 100;

    prepared.push({
      listing,
      ticket,
      sellerPayout,
      organiserRevenue,
      sellerPaymentIntentId: ticket.stripePaymentIntentId,
    });
  }

  if (!prepared.length) return;

  for (const item of prepared) {
    const refundResult = await resolveSellerRefundForListing(
      item.listing,
      item.sellerPaymentIntentId,
      item.sellerPayout,
    );

    if (item.sellerPayout > 0 && refundResult.outcome !== "succeeded") {
      logPayment({
        event: "resale_settlement_blocked",
        outcome: "failure",
        type: "resale",
        orderId: order._id.toString(),
        metadata: {
          listingId: item.listing._id.toString(),
          refundOutcome: refundResult.outcome,
          message: refundResult.message ?? "",
        },
      });
      throw AppError.serviceUnavailable(
        refundResult.outcome === "pending"
          ? "Seller refund is still processing. Settlement will retry automatically."
          : refundResult.message ||
              "Could not refund the original buyer; resale not finalized.",
      );
    }
  }

  for (const item of prepared) {
    const { listing, ticket, sellerPayout, organiserRevenue } = item;

    listing.status = "sold";
    listing.buyerId = order.userId;
    listing.resaleOrderId = order._id;
    listing.platformFee = order.capturedBookingFee;
    listing.sellerPayout = sellerPayout;
    listing.organiserRevenue = organiserRevenue;

    const sellerPaymentIntentId = item.sellerPaymentIntentId;

    const previousTicketId = ticket._id.toString();
    const previousQrCode = ticket.qrCode;
    const previousBatch = ticket.ticketBatchName;

    if (!ticket.primaryInventoryBatchName) {
      ticket.primaryInventoryBatchName =
        listing.originalTicketBatchName || ticket.ticketBatchName;
    }

    ticket.userId = order.userId;
    ticket.ticketBatchName = listing.targetTicketBatchName;
    ticket.purchasePrice = listing.askingPrice;
    ticket.status = "active";
    ticket.qrCode = crypto.randomUUID();
    await ticket.save();
    await listing.save();

    logPayment({
      event: "resale_transfer_completed",
      outcome: "success",
      type: "resale",
      orderId: order._id.toString(),
      paymentIntentId: order.stripePaymentIntentId ?? undefined,
      userId:
        order.userId && typeof order.userId.toString === "function"
          ? order.userId.toString()
          : undefined,
      amountGbp: Number(listing.askingPrice),
      metadata: {
        listingId: listing._id.toString(),
        oldTicketId: previousTicketId,
        newTicketId: ticket._id.toString(),
        oldQrCode: previousQrCode,
        newQrCode: ticket.qrCode,
        originalBatch: listing.originalTicketBatchName,
        targetBatch: listing.targetTicketBatchName,
        previousBatch,
        reallocationType: listing.reallocationType,
        sellerPayout,
        organiserRevenue,
        sellerRefundId: listing.sellerRefundId ?? undefined,
        sellerRefundStatus: listing.sellerRefundStatus ?? undefined,
        sellerPaymentIntentId: sellerPaymentIntentId ?? undefined,
      },
    });

    notifySellerOfSale(listing, order).catch((err) =>
      console.error("[Resale] Failed to notify seller:", err),
    );
  }
}

async function notifySellerOfSale(listing: any, order: any) {
  const seller = (await User.findById(listing.sellerId).lean()) as any;
  if (!seller) return;

  const event = (await Event.findById(listing.eventId).lean()) as any;
  const eventName = event?.eventName || order.eventName || "Unknown Event";

  await sendTicketSoldEmail({
    email: seller.email,
    sellerName: seller.name,
    eventName,
    ticketBatchName: order.ticketBatchName || "General",
    askingPrice: listing.askingPrice,
    sellerPayout: listing.sellerPayout,
    buyerName: order.customerName || "A buyer",
  });

  await createNotification({
    userId: listing.sellerId.toString(),
    type: "resale_sold",
    title: "Your Ticket Was Sold",
    body: `${eventName} (${order.ticketBatchName || "General"}) sold for £${Number(listing.askingPrice || 0).toFixed(2)}.`,
    metadata: {
      listingId: listing._id.toString(),
      eventId: listing.eventId?.toString?.() ?? String(listing.eventId),
      resaleOrderId: order._id.toString(),
      sellerPayout: listing.sellerPayout,
      sellerRefundStatus: listing.sellerRefundStatus,
    },
    dedupeKey: `resale_sold:${listing._id.toString()}`,
  });
}

async function cancelResaleOnExpiry(listingId: mongoose.Types.ObjectId) {
  const listing = await ResaleListing.findById(listingId);
  if (!listing || listing.status !== "active") return;

  listing.status = "cancelled";
  await listing.save();

  await Ticket.findByIdAndUpdate(listing.ticketId, { status: "active" });
}

// ── Read helpers ────────────────────────────────────────

export async function getOrderBySessionId(sessionId: string) {
  const order = (await Order.findOne({
    stripeSessionId: sessionId,
  }).lean()) as any;
  if (!order) throw AppError.notFound("Order not found");
  return formatOrder(order);
}

function formatOrder(order: any) {
  return {
    id: (order._id ?? order.id).toString(),
    eventName: order.eventName,
    ticketBatchName: order.ticketBatchName,
    quantity: order.quantity,
    basePrice: order.basePrice,
    capturedBookingFee: order.capturedBookingFee,
    totalAmount: order.totalAmount,
    type: order.type || "primary",
    status: order.status,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
  };
}

// ── Webhook ─────────────────────────────────────────────

export async function handleWebhookEvent(rawBody: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "invalid_signature";
    logPayment({
      event: "webhook_signature_invalid",
      outcome: "failure",
      type: "webhook",
      errorMessage: msg,
      reason:
        "Stripe webhook signature verification failed — check STRIPE_WEBHOOK_SECRET and raw body",
    });
    throw AppError.badRequest("Webhook signature verification failed");
  }

  logPayment({
    event: "webhook_received",
    outcome: "success",
    type: "webhook",
    stripeEventType: stripeEvent.type,
    metadata: { id: stripeEvent.id },
  });

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const order = await findOrCreateOrderFromSession(session, "paid");

      const listingIdsForTransfer = listingIdsForCheckoutOrder(
        order,
        session.metadata as Record<string, string> | undefined,
      );
      const needsResaleSettlement = listingIdsForTransfer.length > 0;

      order.stripePaymentIntentId =
        (session.payment_intent as string) || order.stripePaymentIntentId;
      order.customerEmail =
        session.customer_details?.email ?? order.customerEmail;
      order.customerName =
        session.customer_details?.name ?? order.customerName;

      if (!needsResaleSettlement && order.status !== "paid") {
        order.status = "paid";
      }
      await order.save();

      logPayment({
        event: "webhook_checkout_completed",
        outcome: "success",
        type: "webhook",
        sessionId: session.id,
        orderId: order._id.toString(),
        paymentIntentId: session.payment_intent as string | undefined,
        userId: order.userId?.toString(),
        amountGbp: order.totalAmount,
        metadata: { orderType: order.type },
      });

      try {
        if (order.type === "primary") {
          const primaryQuantity = parsePrimaryQuantity(
            session.metadata,
            order.quantity,
          );

          if (needsResaleSettlement) {
            await completeResaleTransfer(order, listingIdsForTransfer);
          }
          await generateTickets(order, primaryQuantity);
          if (order.userId) {
            await createNotification({
              userId: order.userId.toString(),
              type: "order_paid",
              title: "Booking Confirmed",
              body: `${order.quantity} × ${order.ticketBatchName} for ${order.eventName} has been confirmed.`,
              metadata: {
                orderId: order._id.toString(),
                eventId: order.eventId?.toString?.() ?? String(order.eventId),
                type: order.type,
                totalAmount: order.totalAmount,
              },
              dedupeKey: `order_paid:${order._id.toString()}`,
            });
          }
          if (order.customerEmail) {
            sendBookingConfirmationEmail({
              email: order.customerEmail,
              customerName: order.customerName || "",
              eventName: order.eventName,
              ticketBatchName: order.ticketBatchName,
              quantity: order.quantity,
              totalAmount: order.totalAmount,
              orderId: order._id.toString(),
            });
          }
        } else if (order.type === "resale") {
          await completeResaleTransfer(order, listingIdsForTransfer);
          if (order.userId) {
            await createNotification({
              userId: order.userId.toString(),
              type: "resale_bought",
              title: "Resale Ticket Purchased",
              body: `Your resale ticket for ${order.eventName} is confirmed.`,
              metadata: {
                orderId: order._id.toString(),
                eventId: order.eventId?.toString?.() ?? String(order.eventId),
                type: order.type,
                totalAmount: order.totalAmount,
              },
              dedupeKey: `resale_bought:${order._id.toString()}`,
            });
          }
          if (order.customerEmail) {
            sendResaleBookingEmail({
              email: order.customerEmail,
              customerName: order.customerName || "",
              eventName: order.eventName,
              ticketBatchName: order.ticketBatchName,
              totalAmount: order.totalAmount,
              orderId: order._id.toString(),
            });
          }
        }
      } catch (err) {
        if (needsResaleSettlement && isSettlementRetryable(err)) {
          order.status = "settlement_pending";
          await order.save();
        }
        throw err;
      }

      if (order.status === "settlement_pending") {
        order.status = "paid";
        await order.save();
      }
      break;
    }

    case "checkout.session.expired": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const order = await Order.findOne({ stripeSessionId: session.id });
      if (order && order.status !== "expired") {
        order.status = "expired";
        await order.save();
        logPayment({
          event: "webhook_checkout_expired",
          outcome: "failure",
          type: "webhook",
          sessionId: session.id,
          orderId: order._id.toString(),
          reason: "Stripe checkout session expired",
          metadata: { orderType: order.type },
        });
        if (order.type === "resale" && order.resaleListingId) {
          const ids = parseListingIds(session.metadata);
          if (ids.length > 0) {
            for (const listingId of ids) {
              await cancelResaleOnExpiry(
                new mongoose.Types.ObjectId(listingId),
              );
            }
          } else {
            await cancelResaleOnExpiry(order.resaleListingId);
          }
        }
      } else if (!order) {
        logPayment({
          event: "webhook_checkout_expired",
          outcome: "pending",
          type: "webhook",
          sessionId: session.id,
          reason: "No matching order in database for expired session",
        });
      }
      break;
    }

    case "account.updated": {
      const account = stripeEvent.data.object as Stripe.Account;
      await syncConnectFromStripeAccount(account);
      logPayment({
        event: "webhook_account_updated",
        outcome: "success",
        type: "webhook",
        metadata: {
          accountId: account.id,
          chargesEnabled: String(account.charges_enabled),
          payoutsEnabled: String(account.payouts_enabled),
          detailsSubmitted: String(account.details_submitted),
        },
      });
      break;
    }

    default: {
      logPayment({
        event: "webhook_unhandled_type",
        outcome: "pending",
        type: "webhook",
        stripeEventType: stripeEvent.type,
        reason: "No handler for this event type",
      });
    }
  }
}
