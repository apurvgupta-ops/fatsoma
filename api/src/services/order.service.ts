import mongoose from "mongoose";
import Order from "../models/Order";
import ResaleListing from "../models/ResaleListing";

interface OrderFilters {
  status?: string;
  type?: string;
  eventId?: string;
  search?: string;
}

function toOrderDTO(order: any) {
  return {
    id: (order._id ?? order.id).toString(),
    eventId: order.eventId?.toString(),
    userId: order.userId?.toString() ?? null,
    eventName: order.eventName,
    ticketBatchName: order.ticketBatchName,
    quantity: order.quantity,
    basePrice: order.basePrice,
    capturedBookingFee: order.capturedBookingFee,
    totalAmount: order.totalAmount,
    currency: order.currency,
    type: order.type || "primary",
    resaleListingId: order.resaleListingId?.toString() ?? null,
    stripeSessionId: order.stripeSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId ?? null,
    status: order.status,
    customerEmail: order.customerEmail ?? null,
    customerName: order.customerName ?? null,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
    updatedAt:
      order.updatedAt instanceof Date
        ? order.updatedAt.toISOString()
        : order.updatedAt,
  };
}

export async function listOrders(filters: OrderFilters = {}) {
  const query: Record<string, any> = {};

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.type && filters.type !== "all") {
    query.type = filters.type;
  }

  if (filters.eventId) {
    query.eventId = filters.eventId;
  }

  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const orConditions: Record<string, any>[] = [
      { eventName: { $regex: escaped, $options: "i" } },
      { customerEmail: { $regex: escaped, $options: "i" } },
      { customerName: { $regex: escaped, $options: "i" } },
      { stripeSessionId: { $regex: escaped, $options: "i" } },
    ];

    const hexSearch = filters.search.toLowerCase();
    if (/^[a-f0-9]+$/.test(hexSearch)) {
      if (
        hexSearch.length === 24 &&
        mongoose.Types.ObjectId.isValid(hexSearch)
      ) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(hexSearch) });
      } else {
        orConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: hexSearch,
              options: "i",
            },
          },
        });
      }
    }

    query.$or = orConditions;
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

  const resaleOrderIds = orders
    .filter((o: any) => o.type === "resale" && o.resaleListingId)
    .map((o: any) => o.resaleListingId);

  const resaleListings =
    resaleOrderIds.length > 0
      ? await ResaleListing.find({ _id: { $in: resaleOrderIds } }).lean()
      : [];
  const listingMap = new Map(
    resaleListings.map((l: any) => [l._id.toString(), l]),
  );

  return orders.map((o: any) => {
    const dto = toOrderDTO(o);
    if (dto.type === "resale" && dto.resaleListingId) {
      const listing = listingMap.get(dto.resaleListingId) as any;
      if (listing) {
        (dto as any).sellerPayout = listing.sellerPayout;
        (dto as any).refundedAmount = listing.sellerPayout;
        (dto as any).organiserRevenue = listing.organiserRevenue;
        (dto as any).originalPurchasePrice = listing.originalPurchasePrice;
      }
    }
    return dto;
  });
}

export async function getMyOrders(userId: string) {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((o: any) => toOrderDTO(o));
}

export async function getOrderStats() {
  const [totalOrders, paidOrders, pendingOrders, revenue, resaleStats] =
    await Promise.all([
      Order.countDocuments({ status: { $in: ["paid", "failed", "expired"] } }),
      Order.countDocuments({ status: "paid" }),
      Order.countDocuments({ status: { $in: ["failed", "expired"] } }),
      Order.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            fees: { $sum: "$capturedBookingFee" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { status: "paid", type: "resale" } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

  const revenueData = revenue[0] ?? { total: 0, fees: 0 };
  const resaleData = resaleStats[0] ?? { count: 0, total: 0 };

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    totalRevenue: Math.round(revenueData.total * 100) / 100,
    totalFees: Math.round(revenueData.fees * 100) / 100,
    resaleOrders: resaleData.count,
    resaleRevenue: Math.round(resaleData.total * 100) / 100,
  };
}
