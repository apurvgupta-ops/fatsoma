import mongoose from "mongoose";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import Order from "../models/Order";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";
import { flattenTicketBatchesFromEvent } from "../domain/eventTickets";
import { ensureTicketGroups } from "../domain/eventTickets";

function ensureCanManageEvent(event: any, userId: string, role: string) {
  if (role === "admin") return;
  if (role !== "organizer") {
    throw AppError.forbidden("Organizer access required");
  }
  const ownerId = event.createdBy?.toString?.() ?? String(event.createdBy ?? "");
  if (!ownerId || ownerId !== userId) {
    throw AppError.forbidden("You can only manage your own events");
  }
}

const VELOCITY_BUCKETS = [14, 10, 7, 4, 2, 1] as const;

export type EventInsightsDto = {
  recovered: number;
  totalResales: number;
  emptySeatsRescued: number;
  repeatBuyerPct: number;
  showUpResale: number;
  showUpPrimary: number;
  ticketsRefunded: number;
  velocityData: { label: string; count: number }[];
  eventsPerYear: number;
  tierUpgrades: ({ count: number; from: string; earned: number } | null)[];
};

function pct(used: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((used / total) * 100);
}

function bucketLabel(days: number): string {
  for (const b of VELOCITY_BUCKETS) {
    if (days >= b) return `${b}d`;
  }
  return "1d";
}

export async function getEventInsights(
  eventId: string,
  userId: string,
  role: string,
): Promise<EventInsightsDto> {
  const event = await Event.findById(eventId).lean();
  if (!event) {
    throw AppError.notFound("Event not found");
  }
  ensureCanManageEvent(event, userId, role);

  const eventOid = new mongoose.Types.ObjectId(eventId);
  const eventStart = new Date(event.eventDate);
  eventStart.setHours(0, 0, 0, 0);

  const [soldListings, tickets, orders, refundedOrders, organizerEventCount] =
    await Promise.all([
      ResaleListing.find({ eventId: eventOid, status: "sold" }).lean(),
      Ticket.find({ eventId: eventOid, status: { $nin: ["cancelled"] } }).lean(),
      Order.find({
        eventId: eventOid,
        status: { $in: ["paid", "settlement_pending", "partially_refunded"] },
      }).lean(),
      Order.find({
        eventId: eventOid,
        status: { $in: ["refunded", "partially_refunded"] },
      }).lean(),
      event.createdBy
        ? Event.countDocuments({
            createdBy: event.createdBy,
            createdAt: {
              $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            },
          })
        : Promise.resolve(1),
    ]);

  const recovered = Math.round(
    soldListings.reduce((s, l) => s + Number(l.organiserRevenue || 0), 0) * 100,
  ) / 100;
  const totalResales = soldListings.length;

  const resaleOrderIds = new Set(
    orders.filter((o) => o.type === "resale").map((o) => String(o._id)),
  );

  let primaryTotal = 0;
  let primaryUsed = 0;
  let resaleTotal = 0;
  let resaleUsed = 0;

  for (const ticket of tickets) {
    const isResale = resaleOrderIds.has(String(ticket.orderId));
    const used = ticket.status === "used";
    if (isResale) {
      resaleTotal += 1;
      if (used) resaleUsed += 1;
    } else {
      primaryTotal += 1;
      if (used) primaryUsed += 1;
    }
  }

  const emptySeatsRescued = soldListings.filter((listing) => {
    const ticket = tickets.find((t) => String(t._id) === String(listing.ticketId));
    return ticket?.status === "used";
  }).length;

  const buyerCounts = new Map<string, number>();
  for (const order of orders) {
    if (!order.userId) continue;
    const key = String(order.userId);
    buyerCounts.set(key, (buyerCounts.get(key) ?? 0) + 1);
  }
  const buyers = buyerCounts.size;
  const repeatBuyers = [...buyerCounts.values()].filter((c) => c > 1).length;
  const repeatBuyerPct = buyers > 0 ? Math.round((repeatBuyers / buyers) * 100) : 0;

  const ticketsRefunded = refundedOrders.reduce(
    (s, o) => s + Number(o.quantity || 0),
    0,
  );

  const velocityCounts = new Map<string, number>(
    VELOCITY_BUCKETS.map((b) => [`${b}d`, 0]),
  );
  for (const listing of soldListings) {
    const soldAt = new Date(listing.updatedAt);
    const daysBefore = Math.max(
      0,
      Math.ceil(
        (eventStart.getTime() - soldAt.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );
    const label = bucketLabel(daysBefore);
    velocityCounts.set(label, (velocityCounts.get(label) ?? 0) + 1);
  }
  const velocityData = VELOCITY_BUCKETS.map((b) => ({
    label: `${b}d`,
    count: velocityCounts.get(`${b}d`) ?? 0,
  }));

  const tiers = flattenTicketBatchesFromEvent({
    ticketGroups: ensureTicketGroups(event),
  });

  const tierUpgrades = tiers.map((tier) => {
    const upgrades = soldListings.filter(
      (l) =>
        l.targetTicketBatchName === tier.name &&
        l.reallocationType !== "same_batch" &&
        Number(l.organiserRevenue || 0) > 0,
    );
    if (upgrades.length === 0) return null;
    const fromCounts = new Map<string, number>();
    for (const u of upgrades) {
      fromCounts.set(
        u.originalTicketBatchName,
        (fromCounts.get(u.originalTicketBatchName) ?? 0) + 1,
      );
    }
    const from =
      [...fromCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "previous tier";
    const earned = Math.round(
      upgrades.reduce((s, l) => s + Number(l.organiserRevenue || 0), 0) * 100,
    ) / 100;
    return { count: upgrades.length, from, earned };
  });

  return {
    recovered,
    totalResales,
    emptySeatsRescued,
    repeatBuyerPct,
    showUpResale: pct(resaleUsed, resaleTotal),
    showUpPrimary: pct(primaryUsed, primaryTotal),
    ticketsRefunded,
    velocityData,
    eventsPerYear: Math.max(1, organizerEventCount),
    tierUpgrades,
  };
}
