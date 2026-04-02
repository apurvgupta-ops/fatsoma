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

const WEB_URL = process.env.WEB_URL || "http://localhost:3001";

function resolvePayPalBaseUrl() {
  const configured = (process.env.PAYPAL_BASE_URL || "").trim();
  if (!configured) return "https://api-m.sandbox.paypal.com";

  const normalized = configured.replace(/\/+$/, "");

  // Guard against common misconfiguration: web host instead of API host.
  if (/^https?:\/\/(www\.)?sandbox\.paypal\.com$/i.test(normalized)) {
    return "https://api-m.sandbox.paypal.com";
  }

  if (/^https?:\/\/(www\.)?paypal\.com$/i.test(normalized)) {
    return "https://api-m.paypal.com";
  }

  return normalized;
}

const PAYPAL_BASE_URL = resolvePayPalBaseUrl();

let cachedPaypalToken: { value: string; expiresAt: number } | null = null;

interface PayPalOrderAmount {
  currency_code: string;
  value: string;
  breakdown?: {
    item_total?: { currency_code: string; value: string };
  };
}

interface PayPalOrderRequest {
  intent: "CAPTURE";
  purchase_units: Array<{
    reference_id: string;
    custom_id?: string;
    description?: string;
    amount: PayPalOrderAmount;
  }>;
  application_context: {
    brand_name: string;
    user_action: "PAY_NOW";
    shipping_preference: "NO_SHIPPING";
    return_url: string;
    cancel_url: string;
  };
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links?: Array<{ href: string; rel: string; method: string }>;
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
      full_name?: string;
    };
  };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id: string; status: string }>;
    };
  }>;
}

async function getPayPalAccessToken() {
  if (cachedPaypalToken && cachedPaypalToken.expiresAt > Date.now() + 60_000) {
    return cachedPaypalToken.value;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError(
      "PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET are not configured",
      500,
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(`Failed to get PayPal token: ${body}`, 502);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedPaypalToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

async function paypalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const detail = typeof body === "object" ? JSON.stringify(body) : String(body);
    throw new AppError(`PayPal request failed: ${detail}`, res.status);
  }

  return body as T;
}

async function createPayPalOrder(payload: PayPalOrderRequest): Promise<{ id: string; approveUrl: string }> {
  const order = await paypalRequest<PayPalOrderResponse>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const approveUrl = order.links?.find((l) => l.rel === "approve")?.href;
  if (!order.id || !approveUrl) {
    throw new AppError("PayPal order did not return approval URL", 500);
  }

  return { id: order.id, approveUrl };
}

async function getPayPalOrder(orderId: string): Promise<PayPalOrderResponse> {
  return paypalRequest<PayPalOrderResponse>(`/v2/checkout/orders/${orderId}`, {
    method: "GET",
  });
}

async function capturePayPalOrder(orderId: string): Promise<PayPalOrderResponse> {
  try {
    return await paypalRequest<PayPalOrderResponse>(
      `/v2/checkout/orders/${orderId}/capture`,
      { method: "POST", body: JSON.stringify({}) },
    );
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 422) {
      const existing = await getPayPalOrder(orderId);
      if (existing.status === "COMPLETED") return existing;
    }
    throw err;
  }
}

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

  let orderId = "";
  let approveUrl = "";

  try {
    const created = await createPayPalOrder({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: "primary",
          custom_id: JSON.stringify({ type: "primary", eventId, batchName, userId }),
          description: `${event.eventName} - ${batchName}`,
          amount: {
            currency_code: "GBP",
            value: totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "GBP",
                value: totalAmount.toFixed(2),
              },
            },
          },
        },
      ],
      application_context: {
        brand_name: "On The List",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${WEB_URL}/checkout/success`,
        cancel_url: `${WEB_URL}/events/${eventId}`,
      },
    });

    orderId = created.id;
    approveUrl = created.approveUrl;

    await Order.create({
      eventId,
      userId,
      eventName: event.eventName,
      ticketBatchName: batchName,
      quantity,
      basePrice,
      capturedBookingFee: fee,
      totalAmount,
      currency: "gbp",
      stripeSessionId: orderId,
      type: "primary",
      status: "pending",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logPayment({
      event: "paypal_order_create_failed",
      outcome: "failure",
      type: "primary",
      userId,
      errorMessage: msg,
      metadata: { eventId, batchName, quantity },
    });
    throw err;
  }

  logPayment({
    event: "paypal_order_created",
    outcome: "success",
    type: "primary",
    sessionId: orderId,
    userId,
    amountGbp: totalAmount,
    currency: "gbp",
    metadata: { eventId, batchName, quantity: String(quantity) },
  });

  return {
    sessionId: orderId,
    url: approveUrl,
  };
}

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
  const totalAmount = Math.round((listing.askingPrice + fee) * 100) / 100;

  let orderId = "";
  let approveUrl = "";

  try {
    const created = await createPayPalOrder({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: "resale",
          custom_id: JSON.stringify({ type: "resale", listingId, userId }),
          description: `${event.eventName} - ${ticket.ticketBatchName} (Resale)`,
          amount: {
            currency_code: "GBP",
            value: totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "GBP",
                value: totalAmount.toFixed(2),
              },
            },
          },
        },
      ],
      application_context: {
        brand_name: "On The List",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${WEB_URL}/checkout/success`,
        cancel_url: `${WEB_URL}/events/${listing.eventId}`,
      },
    });

    orderId = created.id;
    approveUrl = created.approveUrl;

    await Order.create({
      eventId: listing.eventId,
      userId,
      eventName: event.eventName,
      ticketBatchName: ticket.ticketBatchName,
      quantity: 1,
      basePrice: listing.askingPrice,
      capturedBookingFee: fee,
      totalAmount,
      currency: "gbp",
      stripeSessionId: orderId,
      type: "resale",
      resaleListingId: listing._id,
      status: "pending",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logPayment({
      event: "paypal_order_create_failed",
      outcome: "failure",
      type: "resale",
      userId,
      errorMessage: msg,
      metadata: { listingId },
    });
    throw err;
  }

  logPayment({
    event: "paypal_order_created",
    outcome: "success",
    type: "resale",
    sessionId: orderId,
    userId,
    amountGbp: totalAmount,
    currency: "gbp",
    metadata: { listingId },
  });

  return {
    sessionId: orderId,
    url: approveUrl,
  };
}

export async function confirmSession(sessionId: string) {
  const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
  if (!existingOrder) {
    throw AppError.notFound("Order not found");
  }

  if (existingOrder.status === "paid") {
    return formatOrder(existingOrder.toObject());
  }

  const paypalOrder = await capturePayPalOrder(sessionId);

  if (paypalOrder.status !== "COMPLETED") {
    existingOrder.status = "failed";
    await existingOrder.save();
    throw AppError.badRequest("Payment not completed on PayPal");
  }

  const payerEmail = paypalOrder.payer?.email_address;
  const payerName =
    paypalOrder.payer?.name?.full_name ||
    [paypalOrder.payer?.name?.given_name, paypalOrder.payer?.name?.surname]
      .filter(Boolean)
      .join(" ") ||
    undefined;

  const captureId =
    paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.id || undefined;

  existingOrder.status = "paid";
  existingOrder.stripePaymentIntentId = captureId;
  existingOrder.customerEmail = payerEmail;
  existingOrder.customerName = payerName;
  await existingOrder.save();

  logPayment({
    event: "paypal_payment_captured",
    outcome: "success",
    type: "confirm",
    sessionId,
    orderId: existingOrder._id.toString(),
    paymentIntentId: captureId,
    userId: existingOrder.userId?.toString(),
    amountGbp: existingOrder.totalAmount,
    metadata: { orderType: existingOrder.type },
  });

  if (existingOrder.type === "primary") {
    await generateTickets(existingOrder);
    if (existingOrder.customerEmail) {
      sendBookingConfirmationEmail({
        email: existingOrder.customerEmail,
        customerName: existingOrder.customerName || "",
        eventName: existingOrder.eventName,
        ticketBatchName: existingOrder.ticketBatchName,
        quantity: existingOrder.quantity,
        totalAmount: existingOrder.totalAmount,
        orderId: existingOrder._id.toString(),
      });
    }
  } else if (existingOrder.type === "resale") {
    await completeResaleTransfer(existingOrder);
    if (existingOrder.customerEmail) {
      sendResaleBookingEmail({
        email: existingOrder.customerEmail,
        customerName: existingOrder.customerName || "",
        eventName: existingOrder.eventName,
        ticketBatchName: existingOrder.ticketBatchName,
        totalAmount: existingOrder.totalAmount,
        orderId: existingOrder._id.toString(),
      });
    }
  }

  return formatOrder(existingOrder.toObject());
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

  ticket.userId = order.userId;
  ticket.purchasePrice = listing.askingPrice;
  ticket.status = "active";
  ticket.qrCode = crypto.randomUUID();
  await ticket.save();

  await issueSellerRefundPlaceholder(listing, sellerPayout);
  await listing.save();

  notifySellerOfSale(listing, order).catch((err) =>
    console.error("[Resale] Failed to notify seller:", err),
  );
}

async function issueSellerRefundPlaceholder(listing: any, amount: number) {
  listing.sellerRefundStatus = "failed";
  logRefund({
    event: "seller_refund_not_automated",
    outcome: "skipped",
    listingId: listing._id.toString(),
    amountGbp: amount,
    reason: "Automatic seller refund is not implemented for PayPal yet",
  });
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
}

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
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
  };
}

export async function handleWebhookEvent() {
  throw AppError.badRequest("Webhook endpoint is disabled. PayPal flow uses order capture on return.");
}

