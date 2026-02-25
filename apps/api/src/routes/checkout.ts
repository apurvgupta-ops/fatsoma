import { Router, raw } from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import Event from "../models/Event";
import Order from "../models/Order";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const WEB_URL = process.env.WEB_URL || "http://localhost:3001";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is required");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const checkoutRouter = Router();

/**
 * POST /api/checkout/create-session
 * Body: { eventId, batchName, quantity, capturedFee }
 * Creates a Stripe Checkout Session with the captured booking fee baked into the total.
 */
checkoutRouter.post("/create-session", async (req, res, next) => {
  try {
    const { eventId, batchName, quantity, capturedFee } = req.body;

    if (!eventId || !batchName || !quantity || capturedFee == null) {
      res.status(400).json({ ok: false, message: "Missing required fields" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ ok: false, message: "Invalid event ID" });
      return;
    }

    const event = await Event.findById(eventId).lean() as any;
    if (!event || event.status !== "published") {
      res.status(404).json({ ok: false, message: "Event not found or not published" });
      return;
    }

    const batch = event.ticketBatches.find((b: any) => b.name === batchName);
    if (!batch) {
      res.status(400).json({ ok: false, message: `Ticket batch "${batchName}" not found` });
      return;
    }

    if (quantity < 1 || quantity > 10) {
      res.status(400).json({ ok: false, message: "Quantity must be between 1 and 10" });
      return;
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
        eventId: eventId,
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

    res.json({
      ok: true,
      message: "Checkout session created",
      data: {
        sessionId: session.id,
        url: session.url,
        orderId: order._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/checkout/session/:sessionId
 * Retrieve checkout session status (for success page).
 */
checkoutRouter.get("/session/:sessionId", async (req, res, next) => {
  try {
    const sid = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const order = await Order.findOne({ stripeSessionId: sid }).lean() as any;
    if (!order) {
      res.status(404).json({ ok: false, message: "Order not found" });
      return;
    }

    res.json({
      ok: true,
      message: "Order retrieved",
      data: {
        id: order._id.toString(),
        eventName: order.eventName,
        ticketBatchName: order.ticketBatchName,
        quantity: order.quantity,
        basePrice: order.basePrice,
        capturedBookingFee: order.capturedBookingFee,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/checkout/webhook
 * Stripe webhook to update order status on payment completion.
 */
checkoutRouter.post(
  "/webhook",
  raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = getStripe().webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch {
      res.status(400).json({ ok: false, message: "Webhook signature verification failed" });
      return;
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

    res.json({ received: true });
  },
);
