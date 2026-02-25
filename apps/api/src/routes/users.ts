import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { createUserSchema } from "@fatsoma/shared";
import { validate } from "../middleware/validate";
import { authenticate, requireAdmin } from "../middleware/auth";

export const userRouter = Router();

function paramId(req: { params: Record<string, string | string[]> }): string {
  const v = req.params.id;
  return Array.isArray(v) ? v[0] : v;
}

// All user routes require admin
userRouter.use(authenticate, requireAdmin);

// Get all users
userRouter.get("/", async (_req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).select("-password").lean();

    res.json({
      ok: true,
      message: "Users retrieved",
      data: users.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Create user
userRouter.post("/", validate(createUserSchema), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ ok: false, message: "User with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({
      ok: true,
      message: "User created successfully",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Update user status
userRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(paramId(req), { isActive }, { new: true });

    if (!user) {
      res.status(404).json({ ok: false, message: "User not found" });
      return;
    }

    res.json({ ok: true, message: `User ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    next(err);
  }
});

// Update user role
userRouter.patch("/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      res.status(400).json({ ok: false, message: "Role must be admin or user" });
      return;
    }

    const user = await User.findByIdAndUpdate(paramId(req), { role }, { new: true });
    if (!user) {
      res.status(404).json({ ok: false, message: "User not found" });
      return;
    }

    res.json({ ok: true, message: `User role updated to ${role}` });
  } catch (err) {
    next(err);
  }
});

// Delete user
userRouter.delete("/:id", async (req, res, next) => {
  try {
    if (req.user!.userId === paramId(req)) {
      res.status(400).json({ ok: false, message: "You cannot delete your own account" });
      return;
    }

    const user = await User.findByIdAndDelete(paramId(req));
    if (!user) {
      res.status(404).json({ ok: false, message: "User not found" });
      return;
    }

    res.json({ ok: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
});
