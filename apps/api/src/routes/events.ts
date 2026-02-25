import { Router } from "express";
import mongoose from "mongoose";
import Event from "../models/Event";
import { createEventSchema } from "@fatsoma/shared";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

export const eventRouter = Router();

function paramId(req: { params: Record<string, string | string[]> }): string {
  const v = req.params.id;
  return Array.isArray(v) ? v[0] : v;
}

function serializeEvent(event: any) {
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

// Public: get published events
eventRouter.get("/published", async (_req, res, next) => {
  try {
    const events = await Event.find({ status: "published" })
      .sort({ eventDate: 1 })
      .lean();
    res.json({ ok: true, message: "Published events", data: events.map(serializeEvent) });
  } catch (err) {
    next(err);
  }
});

// Auth: get all events (admin sees all, user sees own)
eventRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const filter =
      req.user!.role === "admin"
        ? {}
        : { createdBy: new mongoose.Types.ObjectId(req.user!.userId) };

    const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, message: "Events retrieved", data: events.map(serializeEvent) });
  } catch (err) {
    next(err);
  }
});

// Auth: get single event
eventRouter.get("/:id", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(paramId(req))) {
      res.status(400).json({ ok: false, message: "Invalid event ID" });
      return;
    }

    const event = await Event.findById(paramId(req)).lean();
    if (!event) {
      res.status(404).json({ ok: false, message: "Event not found" });
      return;
    }

    res.json({ ok: true, message: "Event retrieved", data: serializeEvent(event) });
  } catch (err) {
    next(err);
  }
});

// Auth: create event
eventRouter.post("/", authenticate, validate(createEventSchema), async (req, res, next) => {
  try {
    const { status, ...input } = req.body;
    const event = await Event.create({
      ...input,
      eventDate: new Date(input.eventDate),
      status,
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      ok: true,
      message: status === "draft" ? "Event saved as draft" : "Event published successfully",
      data: serializeEvent(event),
    });
  } catch (err) {
    next(err);
  }
});

// Auth: update event
eventRouter.put("/:id", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(paramId(req))) {
      res.status(400).json({ ok: false, message: "Invalid event ID" });
      return;
    }

    const { status, ...input } = req.body;
    const updated = await Event.findByIdAndUpdate(
      paramId(req),
      { ...input, eventDate: input.eventDate ? new Date(input.eventDate) : undefined, status },
      { new: true, runValidators: true },
    );

    if (!updated) {
      res.status(404).json({ ok: false, message: "Event not found" });
      return;
    }

    res.json({ ok: true, message: "Event updated", data: serializeEvent(updated) });
  } catch (err) {
    next(err);
  }
});

// Auth: update event status
eventRouter.patch("/:id/status", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(paramId(req))) {
      res.status(400).json({ ok: false, message: "Invalid event ID" });
      return;
    }

    const { status } = req.body;
    if (!["draft", "published"].includes(status)) {
      res.status(400).json({ ok: false, message: "Status must be draft or published" });
      return;
    }

    const updated = await Event.findByIdAndUpdate(
      paramId(req),
      { status },
      { new: true, runValidators: true },
    );

    if (!updated) {
      res.status(404).json({ ok: false, message: "Event not found" });
      return;
    }

    res.json({ ok: true, message: `Event ${status}`, data: serializeEvent(updated) });
  } catch (err) {
    next(err);
  }
});

// Auth: delete event
eventRouter.delete("/:id", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(paramId(req))) {
      res.status(400).json({ ok: false, message: "Invalid event ID" });
      return;
    }

    const deleted = await Event.findByIdAndDelete(paramId(req));
    if (!deleted) {
      res.status(404).json({ ok: false, message: "Event not found" });
      return;
    }

    res.json({ ok: true, message: "Event deleted" });
  } catch (err) {
    next(err);
  }
});
