import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db";
import { authRouter } from "./routes/auth";
import { eventRouter } from "./routes/events";
import { userRouter } from "./routes/users";
import { uploadRouter } from "./routes/uploads";
import { checkoutRouter } from "./routes/checkout";
import { errorHandler } from "./middleware/error";

const app = express();
const PORT = process.env.PORT || 4000;

const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// Stripe webhook needs raw body — mount before json parser
app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));

// Static uploads — resolve to monorepo root uploads/ folder
const UPLOADS_DIR = path.resolve(process.cwd(), "../../uploads");
app.use("/uploads", express.static(UPLOADS_DIR));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/users", userRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/checkout", checkoutRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
