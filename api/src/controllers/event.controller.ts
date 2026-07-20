import type { Request, Response } from "express";
import * as eventService from "../services/event.service";
import * as eventInsightsService from "../services/eventInsights.service";
import { paramId } from "../utils/paramId";
import { sendSuccess } from "../utils/response";

export async function getPublished(_req: Request, res: Response) {
  const events = await eventService.getPublishedEvents();
  sendSuccess(res, events, "Published events");
}

export async function getAll(req: Request, res: Response) {
  const events = await eventService.getAllEvents(req.user!.userId, req.user!.role);
  sendSuccess(res, events, "Events retrieved");
}

export async function getOne(req: Request, res: Response) {
  const id = paramId(req.params);
  const event = await eventService.getEventById(id, req.user!.userId, req.user!.role);
  sendSuccess(res, event, "Event retrieved");
}

export async function create(req: Request, res: Response) {
  const { event, message } = await eventService.createEvent(
    req.body,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess(res, event, message, 201);
}

export async function update(req: Request, res: Response) {
  const id = paramId(req.params);
  const event = await eventService.updateEvent(
    id,
    req.body,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess(res, event, "Event updated");
}

export async function updateStatus(req: Request, res: Response) {
  const id = paramId(req.params);
  const event = await eventService.updateEventStatus(
    id,
    req.body.status,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess(res, event, `Event ${req.body.status}`);
}

export async function cancel(req: Request, res: Response) {
  const id = paramId(req.params);
  const event = await eventService.cancelEvent(
    id,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess(res, event, "Event cancelled");
}

export async function remove(req: Request, res: Response) {
  const id = paramId(req.params);
  await eventService.deleteEvent(id, req.user!.userId, req.user!.role);
  res.json({ ok: true, message: "Event deleted" });
}

export async function assignOwner(req: Request, res: Response) {
  const id = paramId(req.params);
  const event = await eventService.assignEventOwner(
    id,
    req.body.organizerId,
    req.user!.role,
  );
  sendSuccess(res, event, "Event organizer updated");
}

export async function getInsights(req: Request, res: Response) {
  const id = paramId(req.params);
  const insights = await eventInsightsService.getEventInsights(
    id,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess(res, insights, "Event insights");
}
