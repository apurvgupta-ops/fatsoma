import mongoose, { Schema, model, models } from "mongoose";

export type WithdrawalRequestStatus = "pending" | "approved" | "rejected";

export interface IWithdrawalRequest {
  _id: mongoose.Types.ObjectId;
  organizerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: WithdrawalRequestStatus;
  note?: string;
  adminNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be greater than zero"],
    },
    currency: { type: String, default: "gbp" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    note: { type: String, trim: true, maxlength: 500 },
    adminNote: { type: String, trim: true, maxlength: 500 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

WithdrawalRequestSchema.index({ organizerId: 1, status: 1, createdAt: -1 });

const WithdrawalRequest =
  models?.WithdrawalRequest ||
  model<IWithdrawalRequest>("WithdrawalRequest", WithdrawalRequestSchema);

export default WithdrawalRequest;
