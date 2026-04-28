import mongoose from "mongoose";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import User from "../models/User";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";
import { BOOKING_FEE_PERCENT } from "../shared";
import type { IEvent } from "../models/Event";

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

/** Serialize a Mongoose event doc into an API response shape. */
function toEventDTO(
  event: any,
  soldMap?: Map<string, number>,
  resaleMap?: Map<string, number>,
) {
  const batches = (event.ticketBatches ?? []).map((b: any) => {
    const batch = typeof b.toObject === "function" ? b.toObject() : { ...b };
    const sold = soldMap?.get(batch.name) ?? 0;
    batch.remaining = Math.max(0, batch.quantity - sold);
    batch.resaleAvailable = resaleMap?.get(batch.name) ?? 0;
    batch.totalAvailableForPurchase = batch.remaining + batch.resaleAvailable;
    const cutoff = batch.entryWindowCutoff
      ? new Date(batch.entryWindowCutoff)
      : null;
    batch.entryWindowCutoff =
      cutoff && !Number.isNaN(cutoff.getTime()) ? cutoff.toISOString() : null;
    return batch;
  });

  const totalRemaining = batches.reduce(
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
    startTime: event.startTime,
    endTime: event.endTime,
    totalTickets: totalRemaining,
    ticketBatches: batches,
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
        _id: { eventId: "$eventId", batch: "$ticketBatchName" },
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

async function assertEventOwnerConnectReady(event: any) {
  if (!event?.createdBy) return;
  const owner = (await User.findById(event.createdBy)
    .select("role stripeConnect")
    .lean()) as any;
  if (!owner || owner.role !== "organizer") return;

  const stripeConnect = owner.stripeConnect ?? {};
  const isReady = Boolean(
    stripeConnect.accountId &&
      stripeConnect.onboardingComplete &&
      stripeConnect.chargesEnabled &&
      stripeConnect.payoutsEnabled &&
      stripeConnect.detailsSubmitted,
  );

  if (!isReady) {
    throw AppError.badRequest(
      "Publishing is blocked until the event organiser completes Stripe Connect onboarding",
    );
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

  const { status, bookingFee: _ignored, ...data } = input;
  const ticketBatches = normalizeTicketBatches(data.ticketBatches);
  if (status === "published") {
    await assertEventOwnerConnectReady({ createdBy: userId });
  }
  const event = await Event.create({
    ...data,
    ticketBatches,
    bookingFee: BOOKING_FEE_PERCENT,
    eventDate: new Date(data.eventDate),
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

  const { status, bookingFee: _ignored, ...data } = input;
  if (status === "published") {
    await assertEventOwnerConnectReady(existing);
  }
  const ticketBatches = data.ticketBatches
    ? normalizeTicketBatches(data.ticketBatches)
    : undefined;
  const updated = await Event.findByIdAndUpdate(
    id,
    {
      ...data,
      ...(ticketBatches ? { ticketBatches } : {}),
      bookingFee: BOOKING_FEE_PERCENT,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      status,
    },
    { new: true, runValidators: true },
  );

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
  if (status === "published") {
    await assertEventOwnerConnectReady(existing);
  }

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
