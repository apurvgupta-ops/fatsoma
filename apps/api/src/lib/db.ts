import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb://onthelistapp:Hfz7UqehFbf7kt4fGk9wYg@192.168.1.47:29017/onthelistapp";

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;

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
