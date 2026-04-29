import type { Request, Response } from "express";
import * as orderService from "../services/order.service";
import { sendSuccess } from "../utils/response";

export async function list(req: Request, res: Response) {
  const { status, type, eventId, search } = req.query;

  const orders = await orderService.listOrders({
    status: status as string | undefined,
    type: type as string | undefined,
    eventId: eventId as string | undefined,
    search: search as string | undefined,
  }, req.user!.userId, req.user!.role);

  sendSuccess(res, orders, "Orders retrieved");
}

export async function myOrders(req: Request, res: Response) {
  const orders = await orderService.getMyOrders(req.user!.userId);
  sendSuccess(res, orders, "Orders retrieved");
}

export async function stats(req: Request, res: Response) {
  const { eventId } = req.query;
  const data = await orderService.getOrderStats(
    req.user!.userId,
    req.user!.role,
    eventId as string | undefined,
  );
  sendSuccess(res, data, "Order stats retrieved");
}
