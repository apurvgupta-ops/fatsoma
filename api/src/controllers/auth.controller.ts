import type { Request, Response } from "express";
import * as authService from "../services/auth.service";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const result = await authService.registerUser(name, email, password);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  res.json(result);
}

export async function staffLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.loginStaffUser(email, password);
  res.json(result);
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  res.json(result);
}

export async function getMe(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.userId);
  res.json({ ok: true, message: "User retrieved", data: user });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  const webUrl = process.env.WEB_URL || "http://localhost:3000";
  await authService.forgotPassword(email, webUrl);
  res.json({
    ok: true,
    message:
      "If an account with that email exists, a reset link has been sent.",
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.json({ ok: true, message: "Password has been reset successfully." });
}
