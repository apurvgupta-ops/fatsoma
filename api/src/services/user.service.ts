import bcrypt from "bcryptjs";
import User from "../models/User";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import { sendAccountDeletedEmail } from "../lib/email";
import type { IUser } from "../models/User";

const SALT_ROUNDS = 10;

function staffAssignedEventFromDoc(user: any): {
  id: string;
  eventName: string;
} | null {
  const ref = user.staffEventId;
  if (!ref) return null;
  if (typeof ref === "object" && ref !== null && "eventName" in ref) {
    const id = ref._id?.toString?.() ?? String(ref._id);
    return { id, eventName: String(ref.eventName) };
  }
  return null;
}

function toUserDTO(user: any) {
  const staffEventIdRaw = user.staffEventId;
  const staffEventIdStr =
    staffEventIdRaw &&
    typeof staffEventIdRaw === "object" &&
    "_id" in staffEventIdRaw
      ? staffEventIdRaw._id.toString()
      : staffEventIdRaw
        ? staffEventIdRaw.toString()
        : null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    staffEventId: user.role === "staff" ? staffEventIdStr : null,
    staffGateName: user.role === "staff" ? (user.staffGateName ?? null) : null,
    staffAssignedEvent:
      user.role === "staff" ? staffAssignedEventFromDoc(user) : null,
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
  if (role === "staff") {
    throw AppError.badRequest(
      "Staff accounts must be created with an assigned event. Use POST /api/users/staff.",
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict("User with this email already exists");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashed, role });
  return toUserDTO(user);
}

export async function listStaff(
  requesterId: string,
  requesterRole: "admin" | "organizer",
) {
  const query = User.find({ role: "staff" })
    .sort({ createdAt: -1 })
    .select("-password")
    .populate("staffEventId", "eventName createdBy")
    .lean();

  const rows = (await query) as any[];

  const filtered =
    requesterRole === "organizer"
      ? rows.filter(
          (u) =>
            u.staffEventId &&
            String(u.staffEventId.createdBy) === requesterId,
        )
      : rows;

  return filtered.map(toUserDTO);
}

export async function createStaffUser(
  name: string,
  email: string,
  password: string,
  staffEventId: string,
  staffGateName: string,
  requesterRole: "admin" | "organizer",
  requesterId: string,
) {
  const event = await Event.findById(staffEventId).lean();
  if (!event) {
    throw AppError.badRequest("Event not found");
  }

  if (
    requesterRole === "organizer" &&
    String(event.createdBy) !== requesterId
  ) {
    throw AppError.forbidden(
      "You can only assign staff to events you organise",
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict("User with this email already exists");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({
    name,
    email,
    password: hashed,
    role: "staff",
    staffEventId,
    staffGateName,
  });

  const populated = (await User.findOne({ email })
    .select("-password")
    .populate("staffEventId", "eventName createdBy")
    .lean()) as any;

  return toUserDTO(populated);
}

export async function updateStaffStatus(
  staffUserId: string,
  isActive: boolean,
  requesterId: string,
  requesterRole: "admin" | "organizer",
) {
  const staffUser = (await User.findOne({
    _id: staffUserId,
    role: "staff",
  })
    .populate("staffEventId", "createdBy")
    .lean()) as any;

  if (!staffUser) {
    throw AppError.notFound("Staff user not found");
  }

  if (requesterRole === "organizer") {
    const ev = staffUser.staffEventId;
    if (!ev || String(ev.createdBy) !== requesterId) {
      throw AppError.forbidden("You cannot manage this staff member");
    }
  }

  await User.findByIdAndUpdate(staffUserId, { isActive });
  return isActive ? "Staff member activated" : "Staff member deactivated";
}

export async function deleteStaffUser(
  staffUserId: string,
  requesterId: string,
  requesterRole: "admin" | "organizer",
) {
  const staffUser = (await User.findOne({
    _id: staffUserId,
    role: "staff",
  })
    .populate("staffEventId", "createdBy")
    .lean()) as any;

  if (!staffUser) {
    throw AppError.notFound("Staff user not found");
  }

  if (requesterRole === "organizer") {
    const ev = staffUser.staffEventId;
    if (!ev || String(ev.createdBy) !== requesterId) {
      throw AppError.forbidden("You cannot delete this staff member");
    }
  }

  await User.findByIdAndDelete(staffUserId);
  sendAccountDeletedEmail(staffUser.name, staffUser.email);
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

  const user = await User.findById(id);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  if (user.role === "admin") {
    throw AppError.badRequest("Admin accounts cannot be deleted from this action");
  }

  if (user.role === "organizer") {
    const ownedEvents = await Event.countDocuments({ createdBy: user._id });
    if (ownedEvents > 0) {
      throw AppError.badRequest(
        `Cannot delete organiser with ${ownedEvents} owned event(s). Reassign or delete their events first.`,
      );
    }
  }

  await User.findByIdAndDelete(id);
  sendAccountDeletedEmail(user.name, user.email);
}
