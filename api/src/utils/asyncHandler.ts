import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route/controller handler so thrown errors
 * are automatically forwarded to Express error middleware.
 * Eliminates the need for try/catch in every handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
