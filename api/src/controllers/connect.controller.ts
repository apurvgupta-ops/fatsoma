import type { Request, Response } from "express";
import * as connectService from "../services/connect.service";
import { sendSuccess } from "../utils/response";

export async function createOrRetrieve(req: Request, res: Response) {
  const data = await connectService.createOrRetrieveConnectAccount(
    req.user!.userId,
  );
  sendSuccess(res, data, "Stripe Connect account ready");
}

export async function onboardingLink(req: Request, res: Response) {
  const data = await connectService.createOnboardingLink(req.user!.userId);
  sendSuccess(res, data, "Stripe onboarding link generated");
}

export async function status(req: Request, res: Response) {
  const data = await connectService.getConnectStatus(req.user!.userId);
  sendSuccess(res, data, "Stripe Connect status retrieved");
}

