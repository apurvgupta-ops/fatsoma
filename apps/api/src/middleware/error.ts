import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logServerError } from "../lib/systemLogger";

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
  let status = 500;
  let message = "Internal server error";

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    const firstIssue = err.issues[0];
    message = firstIssue?.message ?? "Validation error";
    res.locals.errorMessage = message;
    res.status(status).json({
      ok: false,
      message,
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    const firstError = Object.values(err.errors)[0];
    message = firstError?.message ?? "Validation error";
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}: ${err.value}`;
  } else if ((err as any).code === 11000) {
    status = 409;
    const field = Object.keys((err as any).keyPattern ?? {})[0] ?? "field";
    message = `Duplicate value for ${field}`;
  } else if (err.message?.includes("File too large")) {
    status = 413;
    message = "File size exceeds 5 MB limit";
  } else {
    console.error("[UnhandledError]", err);
    logServerError({
      message: err.message,
      stack: err.stack,
      path: _req.originalUrl,
      method: _req.method,
    });
  }

  res.locals.errorMessage = message;
  res.status(status).json({ ok: false, message });
}
