import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as calendarCtrl from "../controllers/calendar.controller";

export const calendarRouter = Router();

calendarRouter.get(
  "/google/callback",
  asyncHandler(calendarCtrl.googleCallback),
);
calendarRouter.get(
  "/google/status",
  authenticate,
  asyncHandler(calendarCtrl.getGoogleStatus),
);
calendarRouter.post(
  "/google/connect-url",
  authenticate,
  asyncHandler(calendarCtrl.createGoogleConnectUrl),
);
calendarRouter.post(
  "/google/add-event",
  authenticate,
  asyncHandler(calendarCtrl.addGoogleEvent),
);
calendarRouter.post(
  "/google/disconnect",
  authenticate,
  asyncHandler(calendarCtrl.disconnectGoogle),
);
