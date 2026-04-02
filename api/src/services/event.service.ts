import mongoose from "mongoose";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import { AppError } from "../utils/AppError";
import { BOOKING_FEE_PERCENT } from "../shared";
import type { IEvent } from "../models/Event";

/** Serialize a Mongoose event doc into an API response shape. */
function toEventDTO(event: any, soldMap?: Map<string, number>) {
  const batches = (event.ticketBatches ?? []).map((b: any) => {
    const batch = typeof b.toObject === "function" ? b.toObject() : { ...b };
    const sold = soldMap?.get(batch.name) ?? 0;
    batch.remaining = Math.max(0, batch.quantity - sold);
    return batch;
  });

  const totalRemaining = batches.reduce((s: number, b: any) => s + b.remaining, 0);

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
async function getSoldCountsByEvent(eventIds: string[]): Promise<Map<string, Map<string, number>>> {
  if (eventIds.length === 0) return new Map();

  const pipeline = await Ticket.aggregate([
    {
      $match: {
        eventId: { $in: eventIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $nin: ["cancelled"] },
      },
    },
    { $group: { _id: { eventId: "$eventId", batch: "$ticketBatchName" }, count: { $sum: 1 } } },
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
  const events = await Event.find({ status: "published" }).sort({ eventDate: 1 }).lean();
  const soldMap = await getSoldCountsByEvent(events.map((e: any) => e._id.toString()));
  return events.map((e: any) => toEventDTO(e, soldMap.get(e._id.toString())));
}

export async function getAllEvents(userId: string, role: string) {
  const filter = role === "admin" ? {} : { createdBy: new mongoose.Types.ObjectId(userId) };
  const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
  const soldMap = await getSoldCountsByEvent(events.map((e: any) => e._id.toString()));
  return events.map((e: any) => toEventDTO(e, soldMap.get(e._id.toString())));
}

export async function getEventById(id: string) {
  const event = await Event.findById(id).lean();
  if (!event) {
    throw AppError.notFound("Event not found");
  }
  const soldMap = await getSoldCountsByEvent([id]);
  return toEventDTO(event, soldMap.get(id));
}

export async function createEvent(input: Record<string, any>, userId: string) {
  const { status, bookingFee: _ignored, ...data } = input;
  const event = await Event.create({
    ...data,
    bookingFee: BOOKING_FEE_PERCENT,
    eventDate: new Date(data.eventDate),
    status,
    createdBy: userId,
  });

  const message = status === "draft" ? "Event saved as draft" : "Event published successfully";
  return { event: toEventDTO(event), message };
}

export async function updateEvent(id: string, input: Record<string, any>) {
  const { status, bookingFee: _ignored, ...data } = input;
  const updated = await Event.findByIdAndUpdate(
    id,
    { ...data, bookingFee: BOOKING_FEE_PERCENT, eventDate: data.eventDate ? new Date(data.eventDate) : undefined, status },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw AppError.notFound("Event not found");
  }

  return toEventDTO(updated);
}

export async function updateEventStatus(id: string, status: string) {
  if (!["draft", "published"].includes(status)) {
    throw AppError.badRequest("Status must be draft or published");
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

export async function deleteEvent(id: string) {
  const deleted = await Event.findByIdAndDelete(id);
  if (!deleted) {
    throw AppError.notFound("Event not found");
  }
}
