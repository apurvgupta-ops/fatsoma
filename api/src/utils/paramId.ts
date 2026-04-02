import mongoose from "mongoose";
import { AppError } from "./AppError";

/**
 * Extract a route param that may be string | string[] (Express v5)
 * and validate it as a MongoDB ObjectId.
 */
export function paramId(params: Record<string, string | string[]>, key = "id"): string {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw AppError.badRequest(`Invalid ${key} parameter`);
  }

  return value;
}
