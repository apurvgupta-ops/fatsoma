import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.locals.errorMessage = "Authentication required";
    res.status(401).json({ ok: false, message: "Authentication required" });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.locals.errorMessage = "Invalid or expired token";
    res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.locals.errorMessage = "Admin access required";
    res.status(403).json({ ok: false, message: "Admin access required" });
    return;
  }
  next();
}

export function requireAdminOrStaff(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin" && req.user?.role !== "staff") {
    res.locals.errorMessage = "Staff access required";
    res.status(403).json({ ok: false, message: "Staff access required" });
    return;
  }
  next();
}
