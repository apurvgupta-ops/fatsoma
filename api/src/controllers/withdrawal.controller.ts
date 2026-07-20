import type { Request, Response } from "express";
import * as withdrawalService from "../services/withdrawal.service";
import { paramId } from "../utils/paramId";
import { sendSuccess } from "../utils/response";

export async function getBalance(req: Request, res: Response) {
  if (req.user!.role !== "organizer") {
    const balance = {
      totalEarned: 0,
      reserved: 0,
      available: 0,
      currency: "gbp",
    };
    sendSuccess(res, balance, "Withdrawal balance");
    return;
  }
  const balance = await withdrawalService.getWithdrawalBalance(req.user!.userId);
  sendSuccess(res, balance, "Withdrawal balance");
}

export async function list(req: Request, res: Response) {
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const rows = await withdrawalService.listWithdrawals(
    req.user!.userId,
    req.user!.role,
    status,
  );
  sendSuccess(res, rows, "Withdrawal requests");
}

export async function create(req: Request, res: Response) {
  const created = await withdrawalService.createWithdrawalRequest(
    req.user!.userId,
    req.body,
  );
  sendSuccess(res, created, "Withdrawal request submitted", 201);
}

export async function approve(req: Request, res: Response) {
  const id = paramId(req.params);
  const updated = await withdrawalService.approveWithdrawal(
    id,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess(res, updated, "Withdrawal approved");
}

export async function reject(req: Request, res: Response) {
  const id = paramId(req.params);
  const updated = await withdrawalService.rejectWithdrawal(
    id,
    req.user!.userId,
    req.user!.role,
    req.body.adminNote,
  );
  sendSuccess(res, updated, "Withdrawal rejected");
}
