import mongoose, { Schema, model, models } from "mongoose";

export interface IResaleListing {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  askingPrice: number;
  originalTicketBatchName: string;
  originalPurchasePrice: number;
  targetTicketBatchName: string;
  reallocationType: "same_batch" | "upgraded_batch" | "sold_out_reallocated";
  status: "active" | "sold" | "cancelled" | "expired";
  buyerId?: mongoose.Types.ObjectId;
  resaleOrderId?: mongoose.Types.ObjectId;
  platformFee: number;
  sellerPayout: number;
  organiserRevenue: number;
  sellerRefundId?: string;
  sellerRefundStatus?: "pending" | "succeeded" | "failed";
  sellerPaymentIntentIdAtListing?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResaleListingSchema = new Schema<IResaleListing>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    askingPrice: { type: Number, required: true, min: 0 },
    originalTicketBatchName: { type: String, required: true, trim: true },
    originalPurchasePrice: { type: Number, required: true, min: 0 },
    targetTicketBatchName: { type: String, required: true, trim: true },
    reallocationType: {
      type: String,
      enum: ["same_batch", "upgraded_batch", "sold_out_reallocated"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "sold", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    buyerId: { type: Schema.Types.ObjectId, ref: "User" },
    resaleOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    platformFee: { type: Number, default: 0 },
    sellerPayout: { type: Number, default: 0 },
    organiserRevenue: { type: Number, default: 0 },
    sellerRefundId: { type: String },
    sellerRefundStatus: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
    },
    sellerPaymentIntentIdAtListing: { type: String },
  },
  { timestamps: true },
);

ResaleListingSchema.index({ eventId: 1, status: 1 });

const ResaleListing = models?.ResaleListing || model<IResaleListing>("ResaleListing", ResaleListingSchema);
export default ResaleListing;
