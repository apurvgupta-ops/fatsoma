import mongoose, { Schema, model, models } from "mongoose";

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  eventName: string;
  ticketBatchName: string;
  quantity: number;
  basePrice: number;
  capturedBookingFee: number;
  totalAmount: number;
  refundedAmount?: number;
  currency: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  type: "primary" | "resale";
  resaleListingId?: mongoose.Types.ObjectId;
  status: "pending" | "paid" | "failed" | "expired" | "refunded" | "partially_refunded";
  customerEmail?: string;
  customerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    eventName: { type: String, required: true },
    ticketBatchName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0 },
    capturedBookingFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    refundedAmount: { type: Number, default: 0 },
    currency: { type: String, default: "gbp" },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String },
    type: { type: String, enum: ["primary", "resale"], default: "primary", index: true },
    resaleListingId: { type: Schema.Types.ObjectId, ref: "ResaleListing" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },
    customerEmail: { type: String },
    customerName: { type: String },
  },
  { timestamps: true },
);

const Order = models?.Order || model<IOrder>("Order", OrderSchema);
export default Order;
