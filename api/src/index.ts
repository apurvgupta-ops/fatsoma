import dotenv from "dotenv";
import path from "path";
const nodeEnv =
  process.env.NODE_ENV === "production" ? "production" : "development";
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
});

import express from "express";
import cors from "cors";
import { connectDB } from "./lib/db";
import { authRouter } from "./routes/auth";
import { eventRouter } from "./routes/events";
import { userRouter } from "./routes/users";
import { uploadRouter } from "./routes/uploads";
import { checkoutRouter } from "./routes/checkout";
import { orderRouter } from "./routes/orders";
import { ticketRouter } from "./routes/tickets";
import { resaleRouter } from "./routes/resale";
import { calendarRouter } from "./routes/calendar";
import { notificationRouter } from "./routes/notifications";
import { errorHandler } from "./middleware/error";
import { requestLogger } from "./middleware/logger";

/**
 * Create and configure the Express application.
 * Separated from `start()` so the app can be imported for integration tests.
 */
export function createApp() {
  const app = express();

  // ── CORS ────────────────────────────────────────────
  const origins = (
    process.env.CORS_ORIGIN || "http://localhost:3003,http://localhost:3001"
  )
    .split(",")
    .map((s) => s.trim());
  app.use(cors({ origin: origins, credentials: true }));

  // ── Body parsers ────────────────────────────────────
  app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Static files ────────────────────────────────────
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  // ── Request logger ─────────────────────────────────
  app.use(requestLogger);

  // ── API routes ──────────────────────────────────────
  app.use("/api/auth", authRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/users", userRouter);
  app.use("/api/uploads", uploadRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/tickets", ticketRouter);
  app.use("/api/resale", resaleRouter);
  app.use("/api/calendar", calendarRouter);
  app.use("/api/notifications", notificationRouter);

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
  const PORT = Number(process.env.PORT) || 3016;
  const HOST = process.env.HOST || "0.0.0.0";

  await connectDB();

  const app = createApp();
  app.listen(PORT, HOST, () => {
    console.log(`🚀 API server running on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
