import type { Request, Response } from "express";
import * as calendarService from "../services/calendar.service";
import { sendSuccess, sendMessage } from "../utils/response";

export async function getGoogleStatus(req: Request, res: Response) {
  const status = await calendarService.getGoogleCalendarStatus(
    req.user!.userId,
  );
  sendSuccess(res, status, "Google Calendar status retrieved");
}

export async function createGoogleConnectUrl(req: Request, res: Response) {
  const redirectPath = req.body?.redirectPath as string | undefined;
  const data = await calendarService.createGoogleConnectUrl(
    req.user!.userId,
    redirectPath,
  );
  sendSuccess(res, data, "Google Calendar connect URL created");
}

export async function googleCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code || !state) {
    res.redirect(
      (process.env.WEB_URL || "http://localhost:3001") +
        "/events?calendar=failed",
    );
    return;
  }

  const redirectUrl = await calendarService.handleGoogleCallback(code, state);
  res.redirect(redirectUrl);
}

export async function addGoogleEvent(req: Request, res: Response) {
  const data = await calendarService.addEventToGoogleCalendar(
    req.user!.userId,
    {
      eventName: req.body.eventName,
      eventDescription: req.body.eventDescription,
      eventDate: req.body.eventDate,
      eventEndDate: req.body.eventEndDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      venueName: req.body.venueName,
      city: req.body.city,
      mapsLink: req.body.mapsLink,
    },
  );

  sendSuccess(res, data, "Event added to Google Calendar");
}

export async function disconnectGoogle(req: Request, res: Response) {
  await calendarService.disconnectGoogleCalendar(req.user!.userId);
  sendMessage(res, "Google Calendar disconnected");
}
