import mongoose from "mongoose";

let isConnected = false;

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to the repo root .env (or .env.local).",
    );
  }
  return uri;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;

  const MONGODB_URI = getMongoUri();

  const conn = await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  isConnected = true;
  console.log("✅ MongoDB connected successfully");
  return conn;
}
