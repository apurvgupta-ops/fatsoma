import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import User from "../models/User";

async function seed() {
  try {
    console.log("🌱 Starting database seed...");
    await connectDB();

    const existingAdmin = await User.findOne({ email: "admin@fatsoma.com" });
    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists");
      console.log("\n📧 Email: admin@fatsoma.com");
      console.log("🔑 Password: admin123");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Admin User",
      email: "admin@fatsoma.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log("\n📧 Email: admin@fatsoma.com");
    console.log("🔑 Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
