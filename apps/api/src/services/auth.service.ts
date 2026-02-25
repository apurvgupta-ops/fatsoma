import bcrypt from "bcryptjs";
import User from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { AppError } from "../utils/AppError";
import type { IUser } from "../models/User";

const SALT_ROUNDS = 10;

/** Serialize a Mongoose user doc into a safe API response shape. */
function toUserDTO(user: IUser) {
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

function issueTokens(user: IUser) {
  const payload = { userId: user._id.toString(), role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, password: hashed, role: "user" });
  const tokens = issueTokens(user);

  return { user: toUserDTO(user), tokens };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw AppError.forbidden("Your account has been deactivated");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const tokens = issueTokens(user);
  return { user: toUserDTO(user), tokens };
}

export async function refreshAccessToken(token: string) {
  if (!token) {
    throw AppError.badRequest("Refresh token required");
  }

  try {
    const payload = verifyRefreshToken(token);
    const accessToken = generateAccessToken({ userId: payload.userId, role: payload.role });
    return { accessToken };
  } catch {
    throw AppError.unauthorized("Invalid refresh token");
  }
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId).select("-password").lean() as IUser | null;
  if (!user) {
    throw AppError.notFound("User not found");
  }

  return toUserDTO(user);
}
