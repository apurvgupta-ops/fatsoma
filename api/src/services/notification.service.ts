import mongoose from "mongoose";
import Notification from "../models/Notification";

interface CreateNotificationInput {
  userId: string;
  type:
    | "order_paid"
    | "resale_sold"
    | "resale_bought"
    | "calendar_connected"
    | "system";
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
}

interface ListNotificationsOptions {
  limit?: number;
  cursor?: string;
}

function toNotificationDTO(notification: any) {
  return {
    id: (notification._id ?? notification.id).toString(),
    userId: notification.userId?.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    metadata: notification.metadata ?? null,
    isRead: notification.isRead,
    readAt:
      notification.readAt instanceof Date
        ? notification.readAt.toISOString()
        : (notification.readAt ?? null),
    createdAt:
      notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : notification.createdAt,
  };
}

export async function createNotification(input: CreateNotificationInput) {
  const payload = {
    userId: new mongoose.Types.ObjectId(input.userId),
    type: input.type,
    title: input.title,
    body: input.body,
    metadata: input.metadata,
    dedupeKey: input.dedupeKey,
  };

  try {
    const created = await Notification.create(payload);
    return toNotificationDTO(created.toObject());
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return null;
    }
    throw err;
  }
}

export async function listNotifications(
  userId: string,
  options: ListNotificationsOptions = {},
) {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const query: Record<string, any> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (options.cursor && mongoose.Types.ObjectId.isValid(options.cursor)) {
    query._id = { $lt: new mongoose.Types.ObjectId(options.cursor) };
  }

  const rows = await Notification.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? (sliced[sliced.length - 1]?._id?.toString() ?? null)
    : null;

  return {
    items: sliced.map(toNotificationDTO),
    nextCursor,
  };
}

export async function getUnreadCount(userId: string) {
  const count = await Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });

  return { count };
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  const updated = await Notification.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    { new: true },
  ).lean();

  return updated ? toNotificationDTO(updated) : null;
}

export async function markAllNotificationsRead(userId: string) {
  const now = new Date();
  const result = await Notification.updateMany(
    {
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    },
  );

  return {
    modifiedCount: result.modifiedCount,
  };
}
