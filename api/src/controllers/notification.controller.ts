import type { Request, Response } from "express";
import * as notificationService from "../services/notification.service";
import { sendMessage, sendSuccess } from "../utils/response";

export async function listMyNotifications(req: Request, res: Response) {
  const { limit, cursor } = req.query;
  const data = await notificationService.listNotifications(req.user!.userId, {
    limit: limit ? Number(limit) : undefined,
    cursor: cursor as string | undefined,
  });

  sendSuccess(res, data, "Notifications retrieved");
}

export async function unreadCount(req: Request, res: Response) {
  const data = await notificationService.getUnreadCount(req.user!.userId);
  sendSuccess(res, data, "Unread notification count retrieved");
}

export async function markRead(req: Request, res: Response) {
  const data = await notificationService.markNotificationRead(
    req.user!.userId,
    req.params.id as string,
  );

  if (!data) {
    sendMessage(res, "Notification not found", 404);
    return;
  }

  sendSuccess(res, data, "Notification marked as read");
}

export async function markAllRead(req: Request, res: Response) {
  const data = await notificationService.markAllNotificationsRead(
    req.user!.userId,
  );
  sendSuccess(res, data, "All notifications marked as read");
}
