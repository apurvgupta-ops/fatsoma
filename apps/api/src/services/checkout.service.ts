import Stripe from "stripe";
import mongoose from "mongoose";
import Event from "../models/Event";
import Order from "../models/Order";
import { AppError } from "../utils/AppError";

const WEB_URL = process.env.WEB_URL || "http://localhost:3001";

let _stripe: Stripe | null = null;

/** Lazy-initialise Stripe client so the server can start without the key set. */
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new AppError("STRIPE_SECRET_KEY is not configured", 500);
    _stripe = new Stripe(key);
  }
  return _stripe;
}

interface CreateSessionInput {
  eventId: string;
  batchName: string;
  quantity: number;
  capturedFee: number;
}

export async function createCheckoutSession(input: CreateSessionInput) {
  const { eventId, batchName, quantity, capturedFee } = input;

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
    eventName: event.eventName,
    ticketBatchName: batchName,
    quantity,
    basePrice,
    capturedBookingFee: fee,
    totalAmount,
    stripeSessionId: session.id,
    status: "pending",
  });

  return {
    sessionId: session.id,
    url: session.url,
    orderId: order._id.toString(),
  };
}

export async function getOrderBySessionId(sessionId: string) {
  const order = (await Order.findOne({
    stripeSessionId: sessionId,
  }).lean()) as any;
  if (!order) {
    throw AppError.notFound("Order not found");
  }

  return formatOrder(order);
}

/**
 * Verify payment with Stripe and update the order status accordingly.
 * Called from the success page to handle cases where the webhook hasn't arrived yet.
 */
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
  } else if (session.status === "expired") {
    order.status = "expired";
    await order.save();
  }

  return formatOrder(order.toObject());
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
    status: order.status,
    createdAt: order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : order.createdAt,
  };
}

export async function handleWebhookEvent(rawBody: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    throw AppError.badRequest("Webhook signature verification failed");
  }

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: "paid",
          stripePaymentIntentId: session.payment_intent as string,
          customerEmail: session.customer_details?.email,
          customerName: session.customer_details?.name,
        },
      );
      break;
    }

    case "checkout.session.expired": {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: "expired" },
      );
      break;
    }
  }
}
