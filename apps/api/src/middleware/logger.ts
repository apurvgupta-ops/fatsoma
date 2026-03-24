import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const SKIP_PATHS = ["/api/health", "/uploads"];

const LOGS_DIR = path.resolve(process.cwd(), "../../logs");

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getLogFilePath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOGS_DIR, `error-${date}.log`);
}

function writeToFile(entry: string) {
  try {
    ensureLogsDir();
    fs.appendFileSync(getLogFilePath(), entry + "\n", "utf-8");
  } catch {
    // Silently ignore file write failures to avoid crashing the server
  }
}

function colorStatus(status: number): string {
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`;
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;
  return `\x1b[32m${status}\x1b[0m`;
}

/**
 * Logs one line per API request with method, path, status, duration,
 * authenticated user, and error message (on failure).
 * Skips health checks and static file requests.
 *
 * Error logs (4xx/5xx) are also written to logs/error-YYYY-MM-DD.log
 * for later inspection.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.some((p) => req.path.startsWith(p))) {
    next();
    return;
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const method = req.method.padEnd(6);
    const status = res.statusCode;
    const userId = req.user?.userId ?? "";
    const errMsg = res.locals.errorMessage as string | undefined;

    let consoleLine = `[API] ${method} ${req.originalUrl} ${colorStatus(status)} ${duration}ms`;
    if (userId) consoleLine += ` user=${userId}`;
    if (errMsg && status >= 400) consoleLine += ` — "${errMsg}"`;

    if (status >= 500) {
      console.error(consoleLine);
    } else if (status >= 400) {
      console.warn(consoleLine);
    } else {
      console.log(consoleLine);
    }

    if (status >= 400) {
      const timestamp = new Date().toISOString();
      const ip = req.ip || req.socket.remoteAddress || "-";
      let fileLine = `[${timestamp}] ${status} ${req.method} ${req.originalUrl} ${duration}ms ip=${ip}`;
      if (userId) fileLine += ` user=${userId}`;
      if (errMsg) fileLine += ` error="${errMsg}"`;
      writeToFile(fileLine);
    }
  });

  next();
}
