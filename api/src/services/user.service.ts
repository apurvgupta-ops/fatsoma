import bcrypt from "bcryptjs";
import User from "../models/User";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import { sendAccountDeletedEmail } from "../lib/email";
import type { IUser } from "../models/User";

const SALT_ROUNDS = 10;

function toUserDTO(user: any) {
  const stripeConnect = user.stripeConnect ?? {
    accountId: null,
    onboardingComplete: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
  };

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    stripeConnectAccountId: stripeConnect.accountId ?? null,
    stripeConnectOnboardingComplete: Boolean(stripeConnect.onboardingComplete),
    stripeConnectChargesEnabled: Boolean(stripeConnect.chargesEnabled),
    stripeConnectPayoutsEnabled: Boolean(stripeConnect.payoutsEnabled),
    stripeConnectDetailsSubmitted: Boolean(stripeConnect.detailsSubmitted),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers(
  role?: "admin" | "staff" | "organizer" | "user",
) {
  const filter = role ? { role } : {};
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .select("-password")
    .lean();

  if (role !== "organizer") {
    return users.map(toUserDTO);
  }

  const organizerIds = users.map((user: any) => user._id);
  const ownershipCounts = await Event.aggregate([
    { $match: { createdBy: { $in: organizerIds } } },
    { $group: { _id: "$createdBy", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(
    ownershipCounts.map((row: any) => [String(row._id), Number(row.count)]),
  );

  return users.map((user: any) => ({
    ...toUserDTO(user),
    ownedEventCount: countMap.get(String(user._id)) ?? 0,
  }));
}

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: "admin" | "staff" | "organizer" | "user",
) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict("User with this email already exists");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashed, role });
  return toUserDTO(user);
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  return isActive ? "User activated" : "User deactivated";
}

export async function updateUserRole(id: string, role: string) {
  if (!["admin", "staff", "organizer", "user"].includes(role)) {
    throw AppError.badRequest("Role must be admin, staff, organizer, or user");
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  return `User role updated to ${role}`;
}

export async function deleteUser(id: string, requestingUserId: string) {
  if (requestingUserId === id) {
    throw AppError.badRequest("You cannot delete your own account");
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  sendAccountDeletedEmail(user.name, user.email);
}
