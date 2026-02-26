import Order from "../models/Order";

interface OrderFilters {
  status?: string;
  eventId?: string;
  search?: string;
}

function toOrderDTO(order: any) {
  return {
    id: (order._id ?? order.id).toString(),
    eventId: order.eventId?.toString(),
    eventName: order.eventName,
    ticketBatchName: order.ticketBatchName,
    quantity: order.quantity,
    basePrice: order.basePrice,
    capturedBookingFee: order.capturedBookingFee,
    totalAmount: order.totalAmount,
    currency: order.currency,
    stripeSessionId: order.stripeSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId ?? null,
    status: order.status,
    customerEmail: order.customerEmail ?? null,
    customerName: order.customerName ?? null,
    createdAt: order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : order.createdAt,
    updatedAt: order.updatedAt instanceof Date
      ? order.updatedAt.toISOString()
      : order.updatedAt,
  };
}

export async function listOrders(filters: OrderFilters = {}) {
  const query: Record<string, any> = {};

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.eventId) {
    query.eventId = filters.eventId;
  }

  if (filters.search) {
    query.$or = [
      { eventName: { $regex: filters.search, $options: "i" } },
      { customerEmail: { $regex: filters.search, $options: "i" } },
      { customerName: { $regex: filters.search, $options: "i" } },
      { stripeSessionId: { $regex: filters.search, $options: "i" } },
    ];
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
  return orders.map(toOrderDTO);
}

export async function getOrderStats() {
  const [totalOrders, paidOrders, revenue] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "paid" }),
    Order.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, fees: { $sum: "$capturedBookingFee" } } },
    ]),
  ]);

  const revenueData = revenue[0] ?? { total: 0, fees: 0 };

  return {
    totalOrders,
    paidOrders,
    pendingOrders: await Order.countDocuments({ status: "pending" }),
    totalRevenue: Math.round(revenueData.total * 100) / 100,
    totalFees: Math.round(revenueData.fees * 100) / 100,
  };
}
