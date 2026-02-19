"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/auth";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
};

export async function createUser(input: CreateUserInput) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return {
        ok: false,
        message: "Unauthorized. Admin access required.",
      };
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      return {
        ok: false,
        message: "User with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await User.create({
      ...input,
      password: hashedPassword,
    });

    revalidatePath("/admin/users");

    return {
      ok: true,
      message: "User created successfully",
      userId: user._id.toString(),
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

export async function getAllUsers() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return [];
    }

    await connectDB();

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("-password")
      .lean()
      .exec();

    return users.map((user: any) => ({
      ...user,
      id: user._id.toString(),
      _id: undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return {
        ok: false,
        message: "Unauthorized. Admin access required.",
      };
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true },
    );

    if (!user) {
      return {
        ok: false,
        message: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      ok: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Error updating user status:", error);
    return {
      ok: false,
      message: "Failed to update user status",
    };
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return {
        ok: false,
        message: "Unauthorized. Admin access required.",
      };
    }

    // Prevent deleting yourself
    if (session.user.id === userId) {
      return {
        ok: false,
        message: "You cannot delete your own account",
      };
    }

    await connectDB();

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return {
        ok: false,
        message: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      ok: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      ok: false,
      message: "Failed to delete user",
    };
  }
}

export async function updateUserRole(userId: string, role: "admin" | "user") {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return {
        ok: false,
        message: "Unauthorized. Admin access required.",
      };
    }

    // Prevent changing your own role
    if (session.user.id === userId) {
      return {
        ok: false,
        message: "You cannot change your own role",
      };
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });

    if (!user) {
      return {
        ok: false,
        message: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      ok: true,
      message: `User role updated to ${role}`,
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      ok: false,
      message: "Failed to update user role",
    };
  }
}
