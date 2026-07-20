import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { AppError } from "../utils/AppError";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../lib/email";
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

/** Serialize a Mongoose user doc into a safe API response shape. */
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
    staffEventId:
      user.role === "staff" ? staffEventIdStr : null,
    staffGateName:
      user.role === "staff" ? (user.staffGateName ?? null) : null,
    staffAssignedEvent:
      user.role === "staff" ? staffAssignedEventFromDoc(user) : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function issueTokens(user: IUser | any) {
  const payload: {
    userId: string;
    role: IUser["role"];
    staffEventId?: string;
    staffGateName?: string;
  } = { userId: user._id.toString(), role: user.role };
  if (user.role === "staff" && user.staffEventId) {
    payload.staffEventId = user.staffEventId.toString();
    payload.staffGateName = user.staffGateName ?? undefined;
  }
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

async function assertStaffHasEventAssignment(user: IUser | any) {
  if (user.role !== "staff") return;
  if (!user.staffEventId) {
    throw AppError.forbidden(
      "This staff account is not assigned to an event. Ask your organizer to update your access.",
    );
  }
  if (!user.staffGateName) {
    throw AppError.forbidden(
      "This staff account is not assigned to a gate. Ask your organizer to update your access.",
    );
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "user",
  });
  const tokens = issueTokens(user);

  sendWelcomeEmail(name, email);

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

  await assertStaffHasEventAssignment(user);

  const tokens = issueTokens(user);
  if (user.role === "staff") {
    await user.populate("staffEventId", "eventName");
  }
  return { user: toUserDTO(user), tokens };
}

export async function loginStaffUser(email: string, password: string) {
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

  if (user.role !== "staff") {
    throw AppError.forbidden("Staff account required");
  }

  await assertStaffHasEventAssignment(user);

  const tokens = issueTokens(user);
  await user.populate("staffEventId", "eventName");
  return { user: toUserDTO(user), tokens };
}

export async function refreshAccessToken(token: string) {
  if (!token) {
    throw AppError.badRequest("Refresh token required");
  }

  try {
    const payload = verifyRefreshToken(token);

    const user = (await User.findById(payload.userId)
      .select("isActive role staffEventId staffGateName")
      .lean()) as IUser | null;
    if (!user || !user.isActive) {
      throw AppError.forbidden("Your account has been deactivated");
    }

    const accessPayload: {
      userId: string;
      role: IUser["role"];
      staffEventId?: string;
      staffGateName?: string;
    } = { userId: payload.userId, role: user.role };
    if (user.role === "staff" && user.staffEventId) {
      accessPayload.staffEventId = user.staffEventId.toString();
      accessPayload.staffGateName = user.staffGateName ?? undefined;
    }

    const accessToken = generateAccessToken(accessPayload);
    return { accessToken };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized("Invalid refresh token");
  }
}

export async function getCurrentUser(userId: string) {
  const doc = await User.findById(userId)
    .select("-password")
    .populate("staffEventId", "eventName");
  if (!doc) {
    throw AppError.notFound("User not found");
  }

  if (!doc.isActive) {
    throw AppError.forbidden("Your account has been deactivated");
  }

  return toUserDTO(doc);
}

export async function forgotPassword(email: string, webUrl: string) {
  const user = await User.findOne({ email });
  if (!user) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetLink = `${webUrl}/reset-password?token=${token}`;
  sendPasswordResetEmail(user.name, email, resetLink);
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw AppError.badRequest("Invalid or expired reset token");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
}
