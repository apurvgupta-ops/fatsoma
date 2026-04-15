import mongoose, { Schema, model, models } from "mongoose";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "order_paid",
        "resale_sold",
        "resale_bought",
        "calendar_connected",
        "system",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    metadata: { type: Schema.Types.Mixed },
    dedupeKey: { type: String, index: { unique: true, sparse: true } },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification =
  models?.Notification ||
  model<INotification>("Notification", NotificationSchema);

export default Notification;
