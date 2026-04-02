import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { sendSuccess } from "../utils/response";

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw AppError.badRequest("No file provided");
  }

  const url = `/uploads/${req.file.filename}`;
  sendSuccess(res, { url, filename: req.file.filename }, "File uploaded");
}
