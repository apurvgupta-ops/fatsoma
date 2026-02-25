import type { Response } from "express";

/**
 * Standardised JSON response helpers.
 * Every API response follows the shape: { ok, message, data? }
 */
export function sendSuccess<T>(res: Response, data: T, message: string, statusCode = 200) {
  res.status(statusCode).json({ ok: true, message, data });
}

export function sendMessage(res: Response, message: string, statusCode = 200) {
  res.status(statusCode).json({ ok: true, message });
}
