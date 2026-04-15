import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as notificationCtrl from "../controllers/notification.controller";

export const notificationRouter = Router();

notificationRouter.get(
  "/my",
  authenticate,
  asyncHandler(notificationCtrl.listMyNotifications),
);
notificationRouter.get(
  "/unread-count",
  authenticate,
  asyncHandler(notificationCtrl.unreadCount),
);
notificationRouter.patch(
  "/:id/read",
  authenticate,
  asyncHandler(notificationCtrl.markRead),
);
notificationRouter.patch(
  "/read-all",
  authenticate,
  asyncHandler(notificationCtrl.markAllRead),
);
