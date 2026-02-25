import type { Request, Response } from "express";
import * as checkoutService from "../services/checkout.service";
import { sendSuccess } from "../utils/response";

export async function createSession(req: Request, res: Response) {
  const data = await checkoutService.createCheckoutSession(req.body);
  sendSuccess(res, data, "Checkout session created");
}

export async function getSession(req: Request, res: Response) {
  const sid = Array.isArray(req.params.sessionId)
    ? req.params.sessionId[0]
    : req.params.sessionId;

  const order = await checkoutService.getOrderBySessionId(sid);
  sendSuccess(res, order, "Order retrieved");
}

export async function webhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;
  await checkoutService.handleWebhookEvent(req.body as Buffer, signature);
  res.json({ received: true });
}
