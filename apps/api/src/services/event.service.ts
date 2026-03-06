import mongoose from "mongoose";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import type { IEvent } from "../models/Event";

/** Serialize a Mongoose event doc into an API response shape. */
function toEventDTO(event: any) {
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
    totalTickets: event.totalTickets,
    ticketBatches: event.ticketBatches,
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

export async function getPublishedEvents() {
  const events = await Event.find({ status: "published" }).sort({ eventDate: 1 }).lean();
  return events.map(toEventDTO);
}

export async function getAllEvents(userId: string, role: string) {
  const filter = role === "admin" ? {} : { createdBy: new mongoose.Types.ObjectId(userId) };
  const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
  return events.map(toEventDTO);
}

export async function getEventById(id: string) {
  const event = await Event.findById(id).lean();
  if (!event) {
    throw AppError.notFound("Event not found");
  }
  return toEventDTO(event);
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
