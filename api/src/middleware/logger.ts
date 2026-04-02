import type { Request, Response, NextFunction } from "express";
import { logApiAccess } from "../lib/systemLogger";

const SKIP_PATHS = ["/api/health", "/uploads"];

function colorStatus(status: number): string {
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`;
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;
  return `\x1b[32m${status}\x1b[0m`;
}

/**
 * Logs every API request to `logs/api-access-YYYY-MM-DD.log` (JSON lines)
 * with method, path, status, duration, userId, IP, and error message when
 * present. Also prints a colored line to the console.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (SKIP_PATHS.some((p) => req.path.startsWith(p))) {
    next();
    return;
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const userId = req.user?.userId ?? "";
    const errMsg = res.locals.errorMessage as string | undefined;
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "";

    let consoleLine = `[API] ${req.method.padEnd(6)} ${req.originalUrl} ${colorStatus(status)} ${duration}ms`;
    if (userId) consoleLine += ` user=${userId}`;
    if (errMsg && status >= 400) consoleLine += ` — "${errMsg}"`;

    if (status >= 500) {
      console.error(consoleLine);
    } else if (status >= 400) {
      console.warn(consoleLine);
    } else {
      console.log(consoleLine);
    }

    logApiAccess({
      method: req.method,
      path: req.originalUrl,
      status,
      durationMs: duration,
      ...(userId ? { userId } : {}),
      ...(ip ? { ip } : {}),
      ...(errMsg && status >= 400 ? { errorMessage: errMsg } : {}),
    });
  });

  next();
}
