import mongoose from "mongoose";
import Order from "../models/Order";
import ResaleListing from "../models/ResaleListing";
import Event from "../models/Event";

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

async function getOrganizerEventIds(userId: string) {
  const events = await Event.find({ createdBy: new mongoose.Types.ObjectId(userId) })
    .select("_id")
    .lean();
  return events.map((event: any) => event._id as mongoose.Types.ObjectId);
}

async function listOrdersScoped(
  filters: OrderFilters = {},
  userId?: string,
  role?: string,
) {
  const query: Record<string, any> = {};
  const requestedType = filters.type && filters.type !== "all" ? filters.type : undefined;

  if (role === "organizer" && userId) {
    const organizerEventIds = await getOrganizerEventIds(userId);
    query.eventId = { $in: organizerEventIds };
  }

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (requestedType === "primary") {
    query.type = "primary";
  } else if (requestedType && requestedType !== "resale") {
    query.type = requestedType;
  }

  if (filters.eventId) {
    if (!mongoose.Types.ObjectId.isValid(filters.eventId)) {
      return [];
    }
    if (query.eventId && typeof query.eventId === "object" && "$in" in query.eventId) {
      const selected = new mongoose.Types.ObjectId(filters.eventId);
      const allowed = (query.eventId.$in as mongoose.Types.ObjectId[]).some(
        (id) => id.toString() === selected.toString(),
      );
      if (!allowed) {
        return [];
      }
      query.eventId = selected;
    } else {
      query.eventId = filters.eventId;
    }
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

  const allOrderIds = orders.map((o: any) => o._id);
  const legacyListingIds = orders
    .filter((o: any) => o.resaleListingId)
    .map((o: any) => o.resaleListingId);

  const resaleListings =
    allOrderIds.length > 0 || legacyListingIds.length > 0
      ? await ResaleListing.find({
          $or: [
            ...(allOrderIds.length > 0
              ? [{ resaleOrderId: { $in: allOrderIds } }]
              : []),
            ...(legacyListingIds.length > 0
              ? [{ _id: { $in: legacyListingIds } }]
              : []),
          ],
        }).lean()
      : [];

  const listingsByOrderId = new Map<string, any[]>();
  const listingById = new Map<string, any>();

  for (const listing of resaleListings as any[]) {
    listingById.set(listing._id.toString(), listing);

    if (listing.resaleOrderId) {
      const orderId = listing.resaleOrderId.toString();
      const existing = listingsByOrderId.get(orderId) ?? [];
      existing.push(listing);
      listingsByOrderId.set(orderId, existing);
    }
  }

  const enrichedOrders = orders.map((o: any) => {
    const dto = toOrderDTO(o);
    const linkedListings = listingsByOrderId.get(dto.id) ?? [];
    const fallbackListing = dto.resaleListingId
      ? listingById.get(dto.resaleListingId)
      : null;
    const listings =
      linkedListings.length > 0
        ? linkedListings
        : fallbackListing
          ? [fallbackListing]
          : [];

    if (listings.length > 0) {
      const sellerPayout = listings.reduce(
        (sum, listing) => sum + Number(listing.sellerPayout || 0),
        0,
      );
      const organiserRevenue = listings.reduce(
        (sum, listing) => sum + Number(listing.organiserRevenue || 0),
        0,
      );
      const originalPurchasePrice = listings.reduce(
        (sum, listing) => sum + Number(listing.originalPurchasePrice || 0),
        0,
      );

      (dto as any).sellerPayout = Math.round(sellerPayout * 100) / 100;
      (dto as any).refundedAmount = Math.round(sellerPayout * 100) / 100;
      (dto as any).organiserRevenue = Math.round(organiserRevenue * 100) / 100;
      (dto as any).originalPurchasePrice =
        Math.round(originalPurchasePrice * 100) / 100;
      (dto as any).resaleListingCount = listings.length;

      // Mixed checkout orders are stored as primary but still include resale settlements.
      // Classify these as resale for payments filtering/display so organisers can audit splits.
      if (dto.type === "primary") {
        (dto as any).type = "resale";
      }
    }
    return dto;
  });

  if (requestedType === "resale") {
    return enrichedOrders.filter((order: any) => order.type === "resale");
  }
  if (requestedType === "primary") {
    return enrichedOrders.filter((order: any) => order.type === "primary");
  }

  return enrichedOrders;
}

export async function listOrders(
  filters: OrderFilters = {},
  userId?: string,
  role?: string,
) {
  return listOrdersScoped(filters, userId, role);
}

export async function getMyOrders(userId: string) {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((o: any) => toOrderDTO(o));
}

export async function getOrderStats(
  userId?: string,
  role?: string,
  eventId?: string,
) {
  let eventMatch: Record<string, unknown> = {};
  if (role === "organizer" && userId) {
    const organizerEventIds = await getOrganizerEventIds(userId);
    eventMatch = { eventId: { $in: organizerEventIds } };
  }

  if (eventId) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return {
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        totalFees: 0,
        resaleOrders: 0,
        resaleRevenue: 0,
      };
    }

    const selected = new mongoose.Types.ObjectId(eventId);
    if (eventMatch.eventId && typeof eventMatch.eventId === "object" && "$in" in (eventMatch.eventId as any)) {
      const allowedIds = (eventMatch.eventId as { $in: mongoose.Types.ObjectId[] }).$in;
      const allowed = allowedIds.some((id) => id.toString() === selected.toString());
      if (!allowed) {
        return {
          totalOrders: 0,
          paidOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          totalFees: 0,
          resaleOrders: 0,
          resaleRevenue: 0,
        };
      }
    }

    eventMatch.eventId = selected;
  }

  const [totalOrders, paidOrders, pendingOrders, revenue, paidOrderDocs] =
    await Promise.all([
      Order.countDocuments({
        ...eventMatch,
        status: {
          $in: ["paid", "failed", "expired", "settlement_pending"],
        },
      }),
      Order.countDocuments({ ...eventMatch, status: "paid" }),
      Order.countDocuments({
        ...eventMatch,
        status: { $in: ["failed", "expired", "settlement_pending"] },
      }),
      Order.aggregate([
        { $match: { ...eventMatch, status: "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            fees: { $sum: "$capturedBookingFee" },
          },
        },
      ]),
      Order.find({ ...eventMatch, status: "paid" })
        .select("_id type resaleListingId totalAmount")
        .lean(),
    ]);

  const revenueData = revenue[0] ?? { total: 0, fees: 0 };
  const paidOrderIds = paidOrderDocs.map((order: any) => order._id);
  const legacyListingIds = paidOrderDocs
    .filter((order: any) => order.resaleListingId)
    .map((order: any) => order.resaleListingId);

  const linkedResaleListings =
    paidOrderIds.length > 0 || legacyListingIds.length > 0
      ? await ResaleListing.find({
          $or: [
            ...(paidOrderIds.length > 0
              ? [{ resaleOrderId: { $in: paidOrderIds } }]
              : []),
            ...(legacyListingIds.length > 0
              ? [{ _id: { $in: legacyListingIds } }]
              : []),
          ],
        })
          .select("resaleOrderId")
          .lean()
      : [];

  const resaleOrderIdSet = new Set(
    linkedResaleListings
      .map((listing: any) => listing.resaleOrderId?.toString())
      .filter((id: string | undefined): id is string => Boolean(id)),
  );

  const resaleOrders = paidOrderDocs.filter(
    (order: any) =>
      order.type === "resale" || resaleOrderIdSet.has(order._id.toString()),
  );
  const resaleRevenue =
    Math.round(
      resaleOrders.reduce(
        (sum: number, order: any) => sum + Number(order.totalAmount || 0),
        0,
      ) * 100,
    ) / 100;

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    totalRevenue: Math.round(revenueData.total * 100) / 100,
    totalFees: Math.round(revenueData.fees * 100) / 100,
    resaleOrders: resaleOrders.length,
    resaleRevenue,
  };
}
