import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db";
import { authRouter } from "./routes/auth";
import { eventRouter } from "./routes/events";
import { userRouter } from "./routes/users";
import { uploadRouter } from "./routes/uploads";
import { checkoutRouter } from "./routes/checkout";
import { orderRouter } from "./routes/orders";
import { errorHandler } from "./middleware/error";

/**
 * Create and configure the Express application.
 * Separated from `start()` so the app can be imported for integration tests.
 */
export function createApp() {
  const app = express();

  // ── CORS ────────────────────────────────────────────
  const origins = (
    process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001"
  )
    .split(",")
    .map((s) => s.trim());
  app.use(cors({ origin: origins, credentials: true }));

  // ── Body parsers ────────────────────────────────────
  // Stripe webhook requires raw body — mounted before JSON parser
  app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Static files ────────────────────────────────────
  const uploadsDir = path.resolve(process.cwd(), "../../uploads");
  app.use("/uploads", express.static(uploadsDir));

  // ── API routes ──────────────────────────────────────
  app.use("/api/auth", authRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/users", userRouter);
  app.use("/api/uploads", uploadRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/orders", orderRouter);

  // ── Health check ────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── Global error handler (must be last) ─────────────
  app.use(errorHandler);

  return app;
}

/**
 * Boot sequence: connect to MongoDB then start listening.
 */
async function start() {
  const PORT = process.env.PORT || 4000;

  await connectDB();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
