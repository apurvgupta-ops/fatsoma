import mongoose, { Schema, model, models } from "mongoose";
import crypto from "crypto";

export interface ITicket {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventName: string;
  ticketBatchName: string;
  purchasePrice: number;
  originalPrice: number;
  stripePaymentIntentId?: string;
  status: "active" | "listed" | "transferred" | "used" | "cancelled";
  usedAt?: Date;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventName: { type: String, required: true },
    ticketBatchName: { type: String, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    stripePaymentIntentId: { type: String },
    status: {
      type: String,
      enum: ["active", "listed", "transferred", "used", "cancelled"],
      default: "active",
      index: true,
    },
    usedAt: { type: Date },
    qrCode: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
  },
  { timestamps: true },
);

TicketSchema.index({ userId: 1, status: 1 });
TicketSchema.index({ eventId: 1, status: 1 });

const Ticket = models?.Ticket || model<ITicket>("Ticket", TicketSchema);
export default Ticket;
