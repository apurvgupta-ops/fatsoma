import Stripe from "stripe";
import mongoose from "mongoose";
import crypto from "crypto";
import Event from "../models/Event";
import Order from "../models/Order";
import Ticket from "../models/Ticket";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";
import User from "../models/User";
import { sendBookingConfirmationEmail, sendResaleBookingEmail, sendTicketSoldEmail } from "../lib/email";
import { logPayment, logRefund } from "../lib/systemLogger";

const WEB_URL = process.env.WEB_URL || "http://localhost:3001";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new AppError("STRIPE_SECRET_KEY is not configured", 500);
    _stripe = new Stripe(key);
  }
  return _stripe;
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

  if (quantity < 1 || quantity > 10) {
    throw AppError.badRequest("Quantity must be between 1 and 10");
  }

  const event = (await Event.findById(eventId).lean()) as any;
  if (!event || event.status !== "published") {
    throw AppError.notFound("Event not found or not published");
  }

  const batch = event.ticketBatches.find((b: any) => b.name === batchName);
  if (!batch) {
    throw AppError.badRequest(`Ticket batch "${batchName}" not found`);
  }

  const soldCount = await Ticket.countDocuments({
    eventId: new mongoose.Types.ObjectId(eventId),
    ticketBatchName: batchName,
    status: { $ne: "cancelled" },
  });
  const remaining = batch.quantity - soldCount;
  if (remaining < quantity) {
    throw AppError.badRequest(
      remaining <= 0
        ? `"${batchName}" tickets are sold out`
        : `Only ${remaining} "${batchName}" ticket(s) remaining`,
    );
  }

  const basePrice = batch.basePrice;
  const fee = Math.round(capturedFee * 100) / 100;
  const unitTotal = basePrice + fee;
  const totalAmount = Math.round(unitTotal * quantity * 100) / 100;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${event.eventName} — ${batchName}`,
              description: `Base: £${basePrice.toFixed(2)} + Booking Fee: £${fee.toFixed(2)}`,
            },
            unit_amount: Math.round(unitTotal * 100),
          },
          quantity,
        },
      ],
      metadata: {
        type: "primary",
        eventId,
        batchName,
        quantity: String(quantity),
        basePrice: String(basePrice),
        capturedFee: String(fee),
        totalAmount: String(totalAmount),
        eventName: event.eventName,
        userId,
      },
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
      metadata: { eventId, batchName, quantity },
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
    metadata: { eventId, batchName, quantity: String(quantity) },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

// ── Resale checkout ─────────────────────────────────────

interface CreateResaleSessionInput {
  listingId: string;
  capturedFee: number;
  userId: string;
}

export async function createResaleCheckoutSession(
  input: CreateResaleSessionInput,
) {
  const { listingId, capturedFee, userId } = input;

  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    throw AppError.badRequest("Invalid listing ID");
  }

  const listing = await ResaleListing.findById(listingId);
  if (!listing || listing.status !== "active") {
    throw AppError.notFound("Listing not found or no longer active");
  }

  if (listing.sellerId.toString() === userId) {
    throw AppError.badRequest("You cannot buy your own listing");
  }

  const ticket = await Ticket.findById(listing.ticketId);
  if (!ticket || ticket.status !== "listed") {
    throw AppError.badRequest("Ticket is no longer available");
  }

  const event = (await Event.findById(listing.eventId).lean()) as any;
  if (!event) throw AppError.notFound("Event not found");

  const fee = Math.round(capturedFee * 100) / 100;
  const unitTotal = listing.askingPrice + fee;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${event.eventName} — ${ticket.ticketBatchName} (Resale)`,
              description: `Resale: £${listing.askingPrice.toFixed(2)} + Booking Fee: £${fee.toFixed(2)}`,
            },
            unit_amount: Math.round(unitTotal * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "resale",
        listingId: listing._id.toString(),
        eventId: listing.eventId.toString(),
        ticketId: ticket._id.toString(),
        eventName: event.eventName,
        ticketBatchName: ticket.ticketBatchName,
        basePrice: String(listing.askingPrice),
        capturedFee: String(fee),
        totalAmount: String(Math.round(unitTotal * 100) / 100),
        userId,
      },
      success_url: `${WEB_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${WEB_URL}/events/${listing.eventId}`,
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
      metadata: { listingId: listing._id.toString() },
    });
    throw err;
  }

  logPayment({
    event: "checkout_session_created",
    outcome: "success",
    type: "resale",
    sessionId: session.id,
    userId,
    amountGbp: Math.round(unitTotal * 100) / 100,
    currency: "gbp",
    metadata: { listingId: listing._id.toString() },
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
    quantity: isPrimary ? Number(meta.quantity) || 1 : 1,
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
    if (order.status !== "paid") {
      order.status = "paid";
      order.stripePaymentIntentId = session.payment_intent as string;
      order.customerEmail = session.customer_details?.email ?? undefined;
      order.customerName = session.customer_details?.name ?? undefined;
      await order.save();
    }

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

    if (order.type === "primary") {
      await generateTickets(order);
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
      await completeResaleTransfer(order);
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
      await cancelResaleOnExpiry(order.resaleListingId);
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

async function generateTickets(order: any) {
  const existingCount = await Ticket.countDocuments({ orderId: order._id });
  if (existingCount > 0) return;

  const tickets = [];
  for (let i = 0; i < order.quantity; i++) {
    tickets.push({
      orderId: order._id,
      eventId: order.eventId,
      userId: order.userId,
      eventName: order.eventName,
      ticketBatchName: order.ticketBatchName,
      purchasePrice: order.basePrice,
      originalPrice: order.basePrice,
      stripePaymentIntentId: order.stripePaymentIntentId || undefined,
      status: "active",
      qrCode: crypto.randomUUID(),
    });
  }
  await Ticket.insertMany(tickets);
}

async function completeResaleTransfer(order: any) {
  if (!order.resaleListingId) return;

  const listing = await ResaleListing.findById(order.resaleListingId);
  if (!listing || listing.status === "sold") return;

  const ticket = await Ticket.findById(listing.ticketId);
  if (!ticket) return;

  const sellerPayout = listing.originalPurchasePrice;
  const organiserRevenue = listing.askingPrice - listing.originalPurchasePrice;

  listing.status = "sold";
  listing.buyerId = order.userId;
  listing.resaleOrderId = order._id;
  listing.platformFee = order.capturedBookingFee;
  listing.sellerPayout = sellerPayout;
  listing.organiserRevenue = organiserRevenue;

  const sellerPaymentIntentId = ticket.stripePaymentIntentId;

  ticket.userId = order.userId;
  ticket.purchasePrice = listing.askingPrice;
  ticket.status = "active";
  ticket.qrCode = crypto.randomUUID();
  await ticket.save();

  await issueSellerRefund(listing, sellerPaymentIntentId, sellerPayout);
  await listing.save();

  notifySellerOfSale(listing, order).catch((err) =>
    console.error("[Resale] Failed to notify seller:", err),
  );
}

/**
 * Issues a partial refund to the seller's original payment method.
 * Falls back gracefully if the original payment intent is unavailable.
 */
async function issueSellerRefund(
  listing: any,
  paymentIntentId: string | undefined,
  amount: number,
) {
  const listingId = listing._id.toString();

  if (!paymentIntentId || amount <= 0) {
    listing.sellerRefundStatus = "failed";
    logRefund({
      event: "seller_refund_skipped",
      outcome: "skipped",
      listingId,
      ...(paymentIntentId ? { paymentIntentId } : {}),
      amountGbp: amount,
      reason: !paymentIntentId
        ? "No stripePaymentIntentId on original ticket"
        : "Refund amount is zero or negative",
    });
    return;
  }

  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100),
      reason: "requested_by_customer",
      metadata: {
        type: "resale_seller_payout",
        listingId,
        sellerId: listing.sellerId.toString(),
      },
    });

    listing.sellerRefundId = refund.id;
    listing.sellerRefundStatus =
      refund.status === "succeeded" ? "succeeded" : "pending";
    logRefund({
      event: "seller_refund_created",
      outcome:
        refund.status === "succeeded"
          ? "success"
          : refund.status === "pending"
            ? "pending"
            : "failure",
      refundId: refund.id,
      listingId,
      paymentIntentId,
      amountGbp: amount,
      ...(refund.status ? { stripeStatus: refund.status } : {}),
    });
  } catch (err: unknown) {
    listing.sellerRefundStatus = "failed";
    const msg = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : undefined;
    logRefund({
      event: "seller_refund_failed",
      outcome: "failure",
      listingId,
      paymentIntentId,
      amountGbp: amount,
      errorMessage: msg,
      errorCode: code,
    });
  }
}

async function notifySellerOfSale(listing: any, order: any) {
  const seller = await User.findById(listing.sellerId).lean() as any;
  if (!seller) return;

  const event = await Event.findById(listing.eventId).lean() as any;
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
      reason: "Stripe webhook signature verification failed — check STRIPE_WEBHOOK_SECRET and raw body",
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

      if (order.status !== "paid") {
        order.status = "paid";
        order.stripePaymentIntentId = session.payment_intent as string;
        order.customerEmail = session.customer_details?.email ?? undefined;
        order.customerName = session.customer_details?.name ?? undefined;
        await order.save();
      }

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

      if (order.type === "primary") {
        await generateTickets(order);
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
        await completeResaleTransfer(order);
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
          await cancelResaleOnExpiry(order.resaleListingId);
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
