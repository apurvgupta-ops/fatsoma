import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

/**
 * Global error handler.
 * Maps known error types to structured JSON responses.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Operational errors thrown intentionally from services/controllers
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ ok: false, message: err.message });
    return;
  }

  // Zod validation errors (from validate middleware or manual parsing)
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    res.status(400).json({
      ok: false,
      message: firstIssue?.message ?? "Validation error",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(err.errors)[0];
    res.status(400).json({
      ok: false,
      message: firstError?.message ?? "Validation error",
    });
    return;
  }

  // Mongoose cast errors (e.g. invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      ok: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
    return;
  }

  // MongoDB duplicate key (code 11000)
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern ?? {})[0] ?? "field";
    res.status(409).json({
      ok: false,
      message: `Duplicate value for ${field}`,
    });
    return;
  }

  // Multer file size limit
  if (err.message?.includes("File too large")) {
    res.status(413).json({ ok: false, message: "File size exceeds 5 MB limit" });
    return;
  }

  // Unknown / unexpected errors
  console.error("[UnhandledError]", err);
  res.status(500).json({ ok: false, message: "Internal server error" });
}
