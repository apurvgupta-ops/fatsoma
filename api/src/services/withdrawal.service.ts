import mongoose from "mongoose";
import WithdrawalRequest from "../models/WithdrawalRequest";
import Order from "../models/Order";
import ResaleListing from "../models/ResaleListing";
import Event from "../models/Event";
import User from "../models/User";
import { AppError } from "../utils/AppError";

const MIN_WITHDRAWAL_GBP = 5;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function getOrganizerEventIds(userId: string) {
  const events = await Event.find({
    createdBy: new mongoose.Types.ObjectId(userId),
  })
    .select("_id")
    .lean();
  return events.map((e: any) => e._id as mongoose.Types.ObjectId);
}

export async function computeOrganizerEarnings(organizerId: string): Promise<number> {
  const eventIds = await getOrganizerEventIds(organizerId);
  if (eventIds.length === 0) return 0;

  const paidOrders = await Order.find({
    eventId: { $in: eventIds },
    status: { $in: ["paid", "partially_refunded"] },
  }).lean();

  let total = 0;
  for (const order of paidOrders as any[]) {
    if (order.type === "resale") continue;
    const gross = Number(order.basePrice || 0) * Number(order.quantity || 0);
    const refunded = Number(order.refundedAmount || 0);
    total += Math.max(0, gross - refunded);
  }

  const soldListings = await ResaleListing.find({
    eventId: { $in: eventIds },
    status: "sold",
  }).lean();

  for (const listing of soldListings as any[]) {
    total += Number(listing.organiserRevenue || 0);
  }

  return round2(total);
}

async function computeReservedAmount(organizerId: string): Promise<number> {
  const rows = await WithdrawalRequest.aggregate([
    {
      $match: {
        organizerId: new mongoose.Types.ObjectId(organizerId),
        status: { $in: ["pending", "approved"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return round2(rows[0]?.total ?? 0);
}

export async function getWithdrawalBalance(organizerId: string) {
  const [totalEarned, reserved] = await Promise.all([
    computeOrganizerEarnings(organizerId),
    computeReservedAmount(organizerId),
  ]);
  const available = round2(Math.max(0, totalEarned - reserved));
  return { totalEarned, reserved, available, currency: "gbp" };
}

function toWithdrawalDTO(
  doc: any,
  organizer?: { name?: string; email?: string },
) {
  return {
    id: doc._id.toString(),
    organizerId: doc.organizerId.toString(),
    organizerName: organizer?.name ?? null,
    organizerEmail: organizer?.email ?? null,
    amount: doc.amount,
    currency: doc.currency ?? "gbp",
    status: doc.status,
    note: doc.note ?? null,
    adminNote: doc.adminNote ?? null,
    reviewedBy: doc.reviewedBy?.toString() ?? null,
    reviewedAt: doc.reviewedAt?.toISOString?.() ?? doc.reviewedAt ?? null,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt,
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt,
  };
}

export async function listWithdrawals(
  userId: string,
  role: string,
  status?: string,
) {
  const filter: Record<string, unknown> = {};
  if (role === "organizer") {
    filter.organizerId = new mongoose.Types.ObjectId(userId);
  }
  if (status && status !== "all") {
    filter.status = status;
  }

  const rows = await WithdrawalRequest.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  const organizerIds = [
    ...new Set(rows.map((r: any) => r.organizerId.toString())),
  ];
  const organizers = await User.find({ _id: { $in: organizerIds } })
    .select("name email")
    .lean();
  const orgMap = new Map(
    organizers.map((u: any) => [u._id.toString(), u]),
  );

  return rows.map((row: any) =>
    toWithdrawalDTO(row, orgMap.get(row.organizerId.toString())),
  );
}

export async function createWithdrawalRequest(
  organizerId: string,
  input: { amount: number; note?: string },
) {
  const user = (await User.findById(organizerId).lean()) as {
    role?: string;
    name?: string;
    email?: string;
  } | null;
  if (!user || user.role !== "organizer") {
    throw AppError.forbidden("Organizer account required");
  }

  const amount = round2(Number(input.amount));
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_GBP) {
    throw AppError.badRequest(
      `Minimum withdrawal amount is £${MIN_WITHDRAWAL_GBP.toFixed(2)}`,
    );
  }

  const pending = await WithdrawalRequest.findOne({
    organizerId,
    status: "pending",
  }).lean();
  if (pending) {
    throw AppError.badRequest(
      "You already have a pending withdrawal request. Wait for admin review before submitting another.",
    );
  }

  const { available } = await getWithdrawalBalance(organizerId);
  if (amount > available) {
    throw AppError.badRequest(
      `Requested amount exceeds available balance (£${available.toFixed(2)})`,
    );
  }

  const created = await WithdrawalRequest.create({
    organizerId,
    amount,
    note: input.note?.trim() || undefined,
    status: "pending",
  });

  return toWithdrawalDTO(created.toObject(), user as any);
}

export async function approveWithdrawal(
  id: string,
  adminId: string,
  adminRole: string,
) {
  if (adminRole !== "admin") {
    throw AppError.forbidden("Admin access required");
  }

  const request = await WithdrawalRequest.findById(id);
  if (!request) throw AppError.notFound("Withdrawal request not found");
  if (request.status !== "pending") {
    throw AppError.badRequest("Only pending requests can be approved");
  }

  request.status = "approved";
  request.reviewedBy = new mongoose.Types.ObjectId(adminId);
  request.reviewedAt = new Date();
  await request.save();

  const organizer = await User.findById(request.organizerId)
    .select("name email")
    .lean();
  return toWithdrawalDTO(request.toObject(), organizer as any);
}

export async function rejectWithdrawal(
  id: string,
  adminId: string,
  adminRole: string,
  adminNote?: string,
) {
  if (adminRole !== "admin") {
    throw AppError.forbidden("Admin access required");
  }

  const request = await WithdrawalRequest.findById(id);
  if (!request) throw AppError.notFound("Withdrawal request not found");
  if (request.status !== "pending") {
    throw AppError.badRequest("Only pending requests can be rejected");
  }

  request.status = "rejected";
  request.reviewedBy = new mongoose.Types.ObjectId(adminId);
  request.reviewedAt = new Date();
  request.adminNote = adminNote?.trim() || undefined;
  await request.save();

  const organizer = await User.findById(request.organizerId)
    .select("name email")
    .lean();
  return toWithdrawalDTO(request.toObject(), organizer as any);
}
