import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff" | "organizer" | "user";
  isActive: boolean;
  googleCalendar?: {
    connected: boolean;
    email?: string | null;
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: Date;
    scope?: string;
    connectedAt?: Date;
  };
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  /** When role is `staff`, tickets are validated only for this event. */
  staffEventId?: mongoose.Types.ObjectId | null;
  /** When role is `staff`, tickets are validated only for this gate. */
  staffGateName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "staff", "organizer", "user"],
        message: "Role must be admin, staff, organizer, or user",
      },
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleCalendar: {
      connected: { type: Boolean, default: false },
      email: { type: String, default: null },
      accessToken: { type: String },
      refreshToken: { type: String },
      expiryDate: { type: Date },
      scope: { type: String },
      connectedAt: { type: Date },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    staffEventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    staffGateName: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ role: 1, staffEventId: 1 });
UserSchema.index({ role: 1, staffGateName: 1 });

const User = models?.User || model<IUser>("User", UserSchema);
export default User;
