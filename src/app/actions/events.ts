"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import mongoose from "mongoose";

type CreateEventInput = {
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  eventImage: string;
  eventBanner?: string;
  venueName: string;
  addressLine: string;
  city: string;
  postcode: string;
  country: string;
  mapsLink?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalTickets: number;
  ticketBatches: {
    name: string;
    quantity: number;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
  }[];
  dynamicPricing: boolean;
  bookingFee: number;
  allowResale: boolean;
  platformCommission: number;
};

export async function createEvent(
  input: CreateEventInput,
  status: "draft" | "published",
) {
  try {
    await connectDB();

    const event = await Event.create({
      ...input,
      eventDate: new Date(input.eventDate),
      status,
    });

    // Revalidate the events list page
    revalidatePath("/events");

    return {
      ok: true,
      message:
        status === "draft"
          ? "Event saved as draft"
          : "Event published successfully",
      eventId: event._id.toString(),
    };
  } catch (error) {
    console.error("Error creating event:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const firstError = Object.values(error.errors)[0];
      return {
        ok: false,
        message: firstError.message || "Validation error",
      };
    }

    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to create event",
    };
  }
}

export async function updateEventStatus(
  eventId: string,
  status: "draft" | "published",
) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return {
        ok: false,
        message: "Invalid event ID",
      };
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { status },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return {
        ok: false,
        message: "Event not found",
      };
    }

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);

    return {
      ok: true,
      message: `Event ${status === "published" ? "published" : "saved as draft"}`,
    };
  } catch (error) {
    console.error("Error updating event status:", error);
    return {
      ok: false,
      message: "Failed to update event",
    };
  }
}

export async function updateEvent(
  eventId: string,
  input: CreateEventInput,
  status: "draft" | "published",
) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return {
        ok: false,
        message: "Invalid event ID",
      };
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      {
        ...input,
        eventDate: new Date(input.eventDate),
        status,
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return {
        ok: false,
        message: "Event not found",
      };
    }

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);

    return {
      ok: true,
      message:
        status === "draft"
          ? "Event updated and saved as draft"
          : "Event updated and published successfully",
      eventId: updated._id.toString(),
    };
  } catch (error) {
    console.error("Error updating event:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const firstError = Object.values(error.errors)[0];
      return {
        ok: false,
        message: firstError.message || "Validation error",
      };
    }

    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to update event",
    };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return {
        ok: false,
        message: "Invalid event ID",
      };
    }

    const deleted = await Event.findByIdAndDelete(eventId);

    if (!deleted) {
      return {
        ok: false,
        message: "Event not found",
      };
    }

    revalidatePath("/events");

    return {
      ok: true,
      message: "Event deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      ok: false,
      message: "Failed to delete event",
    };
  }
}

export async function getAllEvents() {
  try {
    await connectDB();

    const events = await Event.find({}).sort({ createdAt: -1 }).lean().exec();

    // Convert MongoDB documents to plain objects with string IDs
    return events.map((event) => ({
      ...event,
      id: event._id.toString(),
      _id: undefined,
      eventDate: event.eventDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getEventById(eventId: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return null;
    }

    const event = await Event.findById(eventId).lean().exec();

    if (!event) {
      return null;
    }

    // Convert MongoDB document to plain object with string ID
    return {
      ...event,
      id: event._id.toString(),
      _id: undefined,
      eventDate: event.eventDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}
