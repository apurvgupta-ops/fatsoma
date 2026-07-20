import mongoose from "mongoose";
import Stripe from "stripe";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import User from "../models/User";
import Order from "../models/Order";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";
import { BOOKING_FEE_PERCENT } from "../shared";
import { logRefund } from "../lib/systemLogger";
import {
  assertValidTicketGroups,
  ensureTicketGroups,
  flattenTicketBatchesFromEvent,
  normalizeTicketGroups,
  ticketGroupsFromLegacyBatches,
  totalQuantityFromGroups,
  type ITicketBatch,
  type ITicketGroup,
} from "../domain/eventTickets";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new AppError("STRIPE_SECRET_KEY is not configured", 500);
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function startOfLocalCalendarDay(d: Date): Date {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

/** Reject if the event's calendar start day is strictly before today (server local). */
function assertEventDateTodayOrFuture(eventDate: Date): void {
  if (Number.isNaN(eventDate.getTime())) {
    throw AppError.badRequest("Invalid event date");
  }
  const day = startOfLocalCalendarDay(eventDate);
  const today = startOfLocalCalendarDay(new Date());
  if (day.getTime() < today.getTime()) {
    throw AppError.badRequest(
      "Event date must be today or in the future.",
    );
  }
}

function normalizeTicketBatches(batches: any[] = []) {
  return batches.map((batch) => {
    const cutoffRaw = batch?.entryWindowCutoff;
    const cutoffDate =
      typeof cutoffRaw === "string" && cutoffRaw.trim().length > 0
        ? new Date(cutoffRaw)
        : cutoffRaw instanceof Date
          ? cutoffRaw
          : undefined;

    return {
      ...batch,
      entryWindowCutoff:
        cutoffDate && !Number.isNaN(cutoffDate.getTime())
          ? cutoffDate
          : undefined,
    };
  });
}

function enrichBatchForDto(
  batch: any,
  soldMap?: Map<string, number>,
  resaleMap?: Map<string, number>,
) {
  const b = typeof batch.toObject === "function" ? batch.toObject() : { ...batch };
  const sold = soldMap?.get(b.name) ?? 0;
  b.remaining = Math.max(0, b.quantity - sold);
  b.resaleAvailable = resaleMap?.get(b.name) ?? 0;
  b.totalAvailableForPurchase = b.remaining + b.resaleAvailable;
  const cutoff = b.entryWindowCutoff ? new Date(b.entryWindowCutoff) : null;
  b.entryWindowCutoff =
    cutoff && !Number.isNaN(cutoff.getTime()) ? cutoff.toISOString() : null;
  return b;
}

/** Serialize a Mongoose event doc into an API response shape. */
function toEventDTO(
  event: any,
  soldMap?: Map<string, number>,
  resaleMap?: Map<string, number>,
) {
  const groupsPlain = ensureTicketGroups(event);
  const ticketGroups = groupsPlain.map((g) => ({
    title: g.title,
    sortOrder: g.sortOrder,
    batches: g.batches.map((batch) =>
      enrichBatchForDto(batch, soldMap, resaleMap),
    ),
  }));
  const ticketBatches = ticketGroups.flatMap((g) => g.batches);
  const totalRemaining = ticketBatches.reduce(
    (s: number, b: any) => s + b.totalAvailableForPurchase,
    0,
  );

  return {
    id: event._id?.toString() ?? event.id,
    eventName: event.eventName,
    eventDescription: event.eventDescription,
    eventCategory: event.eventCategory,
    eventImage: event.eventImage,
    eventBanner: event.eventBanner,
    venueName: event.venueName,
    addressLine: event.addressLine,
    city: event.city,
    postcode: event.postcode,
    country: event.country,
    mapsLink: event.mapsLink,
    eventDate: event.eventDate?.toISOString?.() ?? event.eventDate,
    eventEndDate:
      (event.eventEndDate ?? event.eventDate)?.toISOString?.() ??
      event.eventEndDate ??
      event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    lastEntryTime: event.lastEntryTime,
    ageRestriction: event.ageRestriction,
    totalTickets: totalRemaining,
    ticketGroups,
    ticketBatches,
    dynamicPricing: event.dynamicPricing,
    bookingFee: event.bookingFee,
    allowResale: event.allowResale,
    platformCommission: event.platformCommission,
    status: event.status,
    createdBy: event.createdBy?.toString?.() ?? event.createdBy,
    createdAt: event.createdAt?.toISOString?.() ?? event.createdAt,
    updatedAt: event.updatedAt?.toISOString?.() ?? event.updatedAt,
  };
}

/**
 * Count sold tickets per batch for the given event IDs.
 * Returns a Map<eventId, Map<batchName, soldCount>>.
 */
async function getSoldCountsByEvent(
  eventIds: string[],
): Promise<Map<string, Map<string, number>>> {
  if (eventIds.length === 0) return new Map();

  const pipeline = await Ticket.aggregate([
    {
      $match: {
        eventId: { $in: eventIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $nin: ["cancelled"] },
      },
    },
    {
      $group: {
        _id: {
          eventId: "$eventId",
          batch: {
            $ifNull: ["$primaryInventoryBatchName", "$ticketBatchName"],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const result = new Map<string, Map<string, number>>();
  for (const row of pipeline) {
    const eid = row._id.eventId.toString();
    if (!result.has(eid)) result.set(eid, new Map());
    result.get(eid)!.set(row._id.batch, row.count);
  }
  return result;
}

async function getActiveResaleCountsByEvent(
  eventIds: string[],
): Promise<Map<string, Map<string, number>>> {
  if (eventIds.length === 0) return new Map();

  const pipeline = await ResaleListing.aggregate([
    {
      $match: {
        eventId: { $in: eventIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: "active",
      },
    },
    {
      $addFields: {
        batchForAvailability: {
          $ifNull: ["$targetTicketBatchName", "$originalTicketBatchName"],
        },
      },
    },
    {
      $match: {
        batchForAvailability: { $ne: null },
      },
    },
    {
      $group: {
        _id: { eventId: "$eventId", batch: "$batchForAvailability" },
        count: { $sum: 1 },
      },
    },
  ]);

  const result = new Map<string, Map<string, number>>();
  for (const row of pipeline) {
    const eid = row._id.eventId.toString();
    if (!result.has(eid)) result.set(eid, new Map());
    result.get(eid)!.set(row._id.batch, row.count);
  }
  return result;
}

function getEventStartDateTime(event: {
  eventDate: Date;
  startTime?: string;
}): Date {
  const d = new Date(event.eventDate);
  const [h, m] = (event.startTime || "00:00").split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function isWithinSixHoursOfEventStart(event: {
  eventDate: Date;
  startTime?: string;
}): boolean {
  const start = getEventStartDateTime(event);
  return start.getTime() - Date.now() < 6 * 60 * 60 * 1000;
}

function batchCutoffEqual(a?: Date, b?: Date): boolean {
  const ta = a?.getTime();
  const tb = b?.getTime();
  if (ta == null && tb == null) return true;
  if (ta == null || tb == null) return false;
  return ta === tb;
}

function assertEventCopyEditable(existing: {
  eventDate: Date;
  startTime?: string;
}) {
  if (isWithinSixHoursOfEventStart(existing)) {
    throw AppError.badRequest(
      "Event name and description can only be edited more than 6 hours before the event starts.",
    );
  }
}

function assertExistingBatchesUnmodified(
  existing: {
    ticketGroups?: ITicketGroup[] | null;
    ticketBatches?: Partial<ITicketBatch>[] | null;
  },
  groups: ITicketGroup[],
) {
  const existingBatches = flattenTicketBatchesFromEvent(existing);
  const incomingFlat = groups.flatMap((g) => g.batches);
  const incomingByName = new Map(incomingFlat.map((b) => [b.name, b]));

  for (const batch of existingBatches) {
    if (!incomingByName.has(batch.name)) {
      throw AppError.badRequest(`Tier "${batch.name}" cannot be removed.`);
    }
  }

  const existingByName = new Map(existingBatches.map((b) => [b.name, b]));
  for (const batch of incomingFlat) {
    const orig = existingByName.get(batch.name);
    if (!orig) continue;

    if (
      batch.quantity !== orig.quantity ||
      batch.basePrice !== orig.basePrice ||
      !batchCutoffEqual(batch.entryWindowCutoff, orig.entryWindowCutoff)
    ) {
      throw AppError.badRequest(
        `Tier "${batch.name}" cannot be modified. Add a new tier instead.`,
      );
    }
  }
}

async function assertTicketGroupsNotBelowSold(
  eventId: string,
  groups: ReturnType<typeof normalizeTicketGroups>,
) {
  const soldMap = await getSoldCountsByEvent([eventId]);
  const soldByBatch = soldMap.get(eventId) ?? new Map<string, number>();

  for (const [batchName, sold] of soldByBatch) {
    if (sold <= 0) continue;
    const batch = groups
      .flatMap((g) => g.batches)
      .find((b) => b.name === batchName);
    if (!batch) {
      throw AppError.badRequest(
        `Can't remove tier "${batchName}" with tickets already sold.`,
      );
    }
    if (batch.quantity < sold) {
      throw AppError.badRequest(
        `Quantity for "${batchName}" can't be reduced below tickets already sold (${sold}).`,
      );
    }
  }
}

export async function getPublishedEvents() {
  const events = await Event.find({ status: "published" })
    .sort({ eventDate: 1 })
    .lean();
  const eventIds = events.map((e: any) => e._id.toString());
  const [soldMap, resaleMap] = await Promise.all([
    getSoldCountsByEvent(eventIds),
    getActiveResaleCountsByEvent(eventIds),
  ]);
  return events.map((e: any) =>
    toEventDTO(
      e,
      soldMap.get(e._id.toString()),
      resaleMap.get(e._id.toString()),
    ),
  );
}

export async function getAllEvents(userId: string, role: string) {
  if (role !== "admin" && role !== "organizer") {
    throw AppError.forbidden("Organizer access required");
  }

  const filter =
    role === "admin" ? {} : { createdBy: new mongoose.Types.ObjectId(userId) };
  const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
  const eventIds = events.map((e: any) => e._id.toString());
  const [soldMap, resaleMap] = await Promise.all([
    getSoldCountsByEvent(eventIds),
    getActiveResaleCountsByEvent(eventIds),
  ]);
  return events.map((e: any) =>
    toEventDTO(
      e,
      soldMap.get(e._id.toString()),
      resaleMap.get(e._id.toString()),
    ),
  );
}

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

export async function getEventById(id: string, userId: string, role: string) {
  const event = await Event.findById(id).lean();
  if (!event) {
    throw AppError.notFound("Event not found");
  }
  ensureCanManageEvent(event, userId, role);
  const [soldMap, resaleMap] = await Promise.all([
    getSoldCountsByEvent([id]),
    getActiveResaleCountsByEvent([id]),
  ]);
  return toEventDTO(event, soldMap.get(id), resaleMap.get(id));
}

export async function createEvent(
  input: Record<string, any>,
  userId: string,
  role: string,
) {
  if (role !== "admin" && role !== "organizer") {
    throw AppError.forbidden("Organizer access required");
  }

  const {
    status,
    bookingFee: _ignored,
    ticketBatches: legacyBatches,
    ticketGroups: incomingGroups,
    ...data
  } = input;

  let groups = normalizeTicketGroups(incomingGroups);
  if (groups.length === 0 && Array.isArray(legacyBatches) && legacyBatches.length > 0) {
    groups = ticketGroupsFromLegacyBatches(normalizeTicketBatches(legacyBatches));
  }
  try {
    assertValidTicketGroups(groups);
  } catch (e) {
    throw AppError.badRequest(
      e instanceof Error ? e.message : "Invalid ticket configuration",
    );
  }

  const totalTickets = totalQuantityFromGroups(groups);
  const startDate = new Date(data.eventDate);
  const endDateRaw = data.eventEndDate ?? data.eventDate;
  assertEventDateTodayOrFuture(startDate);
  const eventEndDate = new Date(endDateRaw);
  if (Number.isNaN(eventEndDate.getTime())) {
    throw AppError.badRequest("Invalid event end date");
  }
  const event = await Event.create({
    ...data,
    ticketGroups: groups,
    totalTickets,
    bookingFee: BOOKING_FEE_PERCENT,
    eventDate: startDate,
    eventEndDate,
    status,
    createdBy: userId,
  });

  const message =
    status === "draft"
      ? "Event saved as draft"
      : "Event published successfully";
  return { event: toEventDTO(event), message };
}

export async function updateEvent(
  id: string,
  input: Record<string, any>,
  userId: string,
  role: string,
) {
  const existing = await Event.findById(id).lean();
  if (!existing) {
    throw AppError.notFound("Event not found");
  }
  ensureCanManageEvent(existing, userId, role);
  if (existing.status === "cancelled") {
    throw AppError.badRequest("Cancelled events cannot be modified");
  }

  const nameChanged =
    input.eventName !== undefined &&
    String(input.eventName).trim() !== String(existing.eventName ?? "").trim();
  const descChanged =
    input.eventDescription !== undefined &&
    String(input.eventDescription).trim() !==
      String(existing.eventDescription ?? "").trim();
  if (nameChanged || descChanged) {
    assertEventCopyEditable(existing);
  }

  const {
    status,
    bookingFee: _ignored,
    ticketBatches: legacyBatches,
    ticketGroups: incomingGroups,
    ...rest
  } = input;

  const updateBody: Record<string, unknown> = {
    ...rest,
    bookingFee: BOOKING_FEE_PERCENT,
    eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
    eventEndDate:
      input.eventEndDate != null && String(input.eventEndDate).trim() !== ""
        ? new Date(input.eventEndDate)
        : undefined,
    status,
  };

  const isTicketPayloadUpdate =
    incomingGroups !== undefined || legacyBatches !== undefined;

  if (isTicketPayloadUpdate) {
    let groups = normalizeTicketGroups(incomingGroups);
    if (
      groups.length === 0 &&
      Array.isArray(legacyBatches) &&
      legacyBatches.length > 0
    ) {
      groups = ticketGroupsFromLegacyBatches(
        normalizeTicketBatches(legacyBatches),
      );
    }
    try {
      assertValidTicketGroups(groups);
    } catch (e) {
      throw AppError.badRequest(
        e instanceof Error ? e.message : "Invalid ticket configuration",
      );
    }
    assertExistingBatchesUnmodified(existing, groups);
    await assertTicketGroupsNotBelowSold(id, groups);
    updateBody.ticketGroups = groups;
    updateBody.totalTickets = totalQuantityFromGroups(groups);
  }

  const mongoUpdate =
    isTicketPayloadUpdate
      ? { ...updateBody, $unset: { ticketBatches: "" } }
      : updateBody;

  if (updateBody.eventDate != null) {
    assertEventDateTodayOrFuture(updateBody.eventDate as Date);
  }

  const updated = await Event.findByIdAndUpdate(id, mongoUpdate, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw AppError.notFound("Event not found");
  }

  return toEventDTO(updated);
}

export async function updateEventStatus(
  id: string,
  status: string,
  userId: string,
  role: string,
) {
  if (!["draft", "published"].includes(status)) {
    throw AppError.badRequest("Status must be draft or published");
  }

  const existing = await Event.findById(id).lean();
  if (!existing) {
    throw AppError.notFound("Event not found");
  }
  ensureCanManageEvent(existing, userId, role);

  const updated = await Event.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw AppError.notFound("Event not found");
  }

  return toEventDTO(updated);
}

export async function cancelEvent(id: string, userId: string, role: string) {
  const existing = await Event.findById(id);
  if (!existing) {
    throw AppError.notFound("Event not found");
  }
  ensureCanManageEvent(existing, userId, role);

  if (existing.status === "cancelled") {
    throw AppError.badRequest("Event is already cancelled");
  }
  if (existing.status !== "published") {
    throw AppError.badRequest("Only published events can be cancelled");
  }

  const eventOid = existing._id;

  await ResaleListing.updateMany(
    { eventId: eventOid, status: "active" },
    { status: "cancelled" },
  );

  await Ticket.updateMany(
    { eventId: eventOid, status: { $ne: "used" } },
    { $set: { status: "cancelled", qrCode: null } },
  );

  const refundableOrders = await Order.find({
    eventId: eventOid,
    status: { $in: ["paid", "settlement_pending", "partially_refunded"] },
  });

  if (refundableOrders.length > 0) {
    const stripe = getStripe();
    for (const order of refundableOrders) {
      if (!order.stripePaymentIntentId) continue;

      const ticketRefundGbp = order.basePrice * order.quantity;
      const alreadyRefundedGbp = order.refundedAmount ?? 0;
      const remainingGbp =
        Math.round((ticketRefundGbp - alreadyRefundedGbp) * 100) / 100;
      if (remainingGbp <= 0) continue;

      const refundPence = Math.round(remainingGbp * 100);
      try {
        await stripe.refunds.create(
          {
            payment_intent: order.stripePaymentIntentId,
            amount: refundPence,
            reason: "requested_by_customer",
          },
          { idempotencyKey: `event_cancel_${id}_${order._id}` },
        );

        order.refundedAmount = alreadyRefundedGbp + remainingGbp;
        order.status = "partially_refunded";
        await order.save();

        logRefund({
          event: "event_cancel_refund",
          outcome: "success",
          orderId: order._id.toString(),
          paymentIntentId: order.stripePaymentIntentId,
          amountGbp: remainingGbp,
          reason: `Event ${id} cancelled — ticket price refunded`,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Refund failed";
        logRefund({
          event: "event_cancel_refund_failed",
          outcome: "failure",
          orderId: order._id.toString(),
          paymentIntentId: order.stripePaymentIntentId,
          errorMessage: message,
        });
        throw AppError.badRequest(
          `Failed to refund order ${order._id}: ${message}`,
        );
      }
    }
  }

  existing.status = "cancelled";
  await existing.save();

  const soldMap = await getSoldCountsByEvent([id]);
  const resaleMap = await getActiveResaleCountsByEvent([id]);
  return toEventDTO(existing, soldMap.get(id), resaleMap.get(id));
}

export async function deleteEvent(id: string, userId: string, role: string) {
  const existing = await Event.findById(id).lean();
  if (!existing) {
    throw AppError.notFound("Event not found");
  }
  ensureCanManageEvent(existing, userId, role);

  const deleted = await Event.findByIdAndDelete(id);
  if (!deleted) {
    throw AppError.notFound("Event not found");
  }
}

export async function assignEventOwner(
  id: string,
  organizerId: string,
  requesterRole: string,
) {
  if (requesterRole !== "admin") {
    throw AppError.forbidden("Admin access required");
  }
  if (!mongoose.Types.ObjectId.isValid(organizerId)) {
    throw AppError.badRequest("Invalid organizer ID");
  }

  const organizer = (await User.findById(organizerId).lean()) as any;
  if (!organizer || organizer.role !== "organizer") {
    throw AppError.badRequest("Organizer account not found");
  }

  const updated = await Event.findByIdAndUpdate(
    id,
    { createdBy: organizer._id },
    { new: true, runValidators: true },
  ).lean();
  if (!updated) {
    throw AppError.notFound("Event not found");
  }

  const soldMap = await getSoldCountsByEvent([id]);
  const resaleMap = await getActiveResaleCountsByEvent([id]);
  return toEventDTO(updated, soldMap.get(id), resaleMap.get(id));
}
