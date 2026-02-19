import { config } from "dotenv";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import connectDB from "../src/lib/mongodb";
import User from "../src/models/User";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@fatsoma.com" });

    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists");
      console.log("\n📧 Email: admin@fatsoma.com");
      console.log("🔑 Password: admin123");
      process.exit(0);
    }

    // Create admin user
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
    console.log("\n⚠️  Please change the password after first login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
