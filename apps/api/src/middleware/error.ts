import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("Unhandled error:", err);

  if (err instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(err.errors)[0];
    res.status(400).json({
      ok: false,
      message: firstError?.message || "Validation error",
    });
    return;
  }

  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
}
