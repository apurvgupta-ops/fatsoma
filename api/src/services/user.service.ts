import bcrypt from "bcryptjs";
import User from "../models/User";
import { AppError } from "../utils/AppError";
import { sendAccountDeletedEmail } from "../lib/email";
import type { IUser } from "../models/User";

const SALT_ROUNDS = 10;

function toUserDTO(user: any) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers() {
  const users = await User.find({}).sort({ createdAt: -1 }).select("-password").lean();
  return users.map(toUserDTO);
}

export async function createUser(name: string, email: string, password: string, role: "admin" | "staff" | "user") {
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
  if (!["admin", "staff", "user"].includes(role)) {
    throw AppError.badRequest("Role must be admin, staff, or user");
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
