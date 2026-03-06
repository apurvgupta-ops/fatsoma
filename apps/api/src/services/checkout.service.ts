import Stripe from "stripe";
import mongoose from "mongoose";
import crypto from "crypto";
import Event from "../models/Event";
import Order from "../models/Order";
import Ticket from "../models/Ticket";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";

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

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
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
    },
    success_url: `${WEB_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${WEB_URL}/events/${eventId}`,
  });

  const order = await Order.create({
    eventId,
    userId,
    eventName: event.eventName,
    ticketBatchName: batchName,
    quantity,
    basePrice,
    capturedBookingFee: fee,
    totalAmount,
    stripeSessionId: session.id,
    type: "primary",
    status: "pending",
  });

  return {
    sessionId: session.id,
    url: session.url,
    orderId: order._id.toString(),
  };
}

// ── Resale checkout ─────────────────────────────────────

interface CreateResaleSessionInput {
  listingId: string;
  capturedFee: number;
  userId: string;
}

export async function createResaleCheckoutSession(input: CreateResaleSessionInput) {
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

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
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
    },
    success_url: `${WEB_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${WEB_URL}/events/${listing.eventId}`,
  });

  const order = await Order.create({
    eventId: listing.eventId,
    userId,
    eventName: event.eventName,
    ticketBatchName: ticket.ticketBatchName,
    quantity: 1,
    basePrice: listing.askingPrice,
    capturedBookingFee: fee,
    totalAmount: Math.round(unitTotal * 100) / 100,
    stripeSessionId: session.id,
    type: "resale",
    resaleListingId: listing._id,
    status: "pending",
  });

  return {
    sessionId: session.id,
    url: session.url,
    orderId: order._id.toString(),
  };
}

// ── Confirm & ticket generation ─────────────────────────

export async function confirmSession(sessionId: string) {
  const order = await Order.findOne({ stripeSessionId: sessionId });
  if (!order) {
    throw AppError.notFound("Order not found");
  }

  if (order.status === "paid") {
    return formatOrder(order.toObject());
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === "paid") {
    order.status = "paid";
    order.stripePaymentIntentId = session.payment_intent as string;
    order.customerEmail = session.customer_details?.email ?? undefined;
    order.customerName = session.customer_details?.name ?? undefined;
    await order.save();

    if (order.type === "primary") {
      await generateTickets(order);
    } else if (order.type === "resale") {
      await completeResaleTransfer(order);
    }
  } else if (session.status === "expired") {
    order.status = "expired";
    await order.save();

    if (order.type === "resale" && order.resaleListingId) {
      await cancelResaleOnExpiry(order.resaleListingId);
    }
  }

  return formatOrder(order.toObject());
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
  await listing.save();

  ticket.userId = order.userId;
  ticket.purchasePrice = listing.askingPrice;
  ticket.status = "active";
  ticket.qrCode = crypto.randomUUID();
  await ticket.save();
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
  const order = (await Order.findOne({ stripeSessionId: sessionId }).lean()) as any;
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
    createdAt: order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : order.createdAt,
  };
}

// ── Webhook ─────────────────────────────────────────────

export async function handleWebhookEvent(rawBody: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw AppError.badRequest("Webhook signature verification failed");
  }

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const order = await Order.findOne({ stripeSessionId: session.id });
      if (order && order.status !== "paid") {
        order.status = "paid";
        order.stripePaymentIntentId = session.payment_intent as string;
        order.customerEmail = session.customer_details?.email ?? undefined;
        order.customerName = session.customer_details?.name ?? undefined;
        await order.save();

        if (order.type === "primary") await generateTickets(order);
        else if (order.type === "resale") await completeResaleTransfer(order);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const order = await Order.findOne({ stripeSessionId: session.id });
      if (order && order.status === "pending") {
        order.status = "expired";
        await order.save();
        if (order.type === "resale" && order.resaleListingId) {
          await cancelResaleOnExpiry(order.resaleListingId);
        }
      }
      break;
    }
  }
}
