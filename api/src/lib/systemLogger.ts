import fs from "fs";
import path from "path";

/**
 * Structured file logging for the API (access, payments, refunds, errors).
 * Default directory: local app `logs/`.
 * Override with `LOG_DIR` (absolute or relative to cwd).
 */

const LOG_ROOT = (() => {
  const raw = process.env.LOG_DIR;
  if (!raw) return path.resolve(process.cwd(), "logs");
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
})();

function ensureDir(): void {
  if (!fs.existsSync(LOG_ROOT)) {
    fs.mkdirSync(LOG_ROOT, { recursive: true });
  }
}

function datedFile(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOG_ROOT, `${prefix}-${date}.log`);
}

function appendFile(filePath: string, line: string): void {
  try {
    ensureDir();
    fs.appendFileSync(filePath, line + "\n", "utf-8");
  } catch {
    // Never crash the API on log failure
  }
}

function writeJson(prefix: string, payload: Record<string, unknown>): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...payload,
  });
  appendFile(datedFile(prefix), line);
}

/** One JSON line per HTTP request (method, path, status, duration). */
export function logApiAccess(payload: {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string;
  ip?: string;
  errorMessage?: string;
}): void {
  writeJson("api-access", payload as Record<string, unknown>);
}

/** Checkout sessions, payment confirmation, webhooks, Stripe errors. */
export function logPayment(payload: {
  event: string;
  outcome?: "success" | "failure" | "pending";
  type?: "primary" | "resale" | "webhook" | "confirm";
  sessionId?: string;
  orderId?: string;
  paymentIntentId?: string;
  userId?: string;
  amountGbp?: number;
  currency?: string;
  stripeEventType?: string;
  reason?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, string | number | undefined>;
}): void {
  writeJson("payments", payload as Record<string, unknown>);
}

/** Seller refunds and other refund operations. */
export function logRefund(payload: {
  event: string;
  outcome: "success" | "failure" | "pending" | "skipped";
  refundId?: string;
  listingId?: string;
  orderId?: string;
  paymentIntentId?: string;
  amountGbp?: number;
  reason?: string;
  errorCode?: string;
  errorMessage?: string;
  stripeStatus?: string;
  /** e.g. sync script vs live API */
  source?: string;
}): void {
  writeJson("refunds", payload as Record<string, unknown>);
}

/** Unhandled errors and 500s (optional stack). */
export function logServerError(payload: {
  message: string;
  stack?: string;
  path?: string;
  method?: string;
}): void {
  writeJson("errors", payload as Record<string, unknown>);
}

export function getLogsDirectory(): string {
  return LOG_ROOT;
}
