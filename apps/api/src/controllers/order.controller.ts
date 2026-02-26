import type { Request, Response } from "express";
import * as orderService from "../services/order.service";
import { sendSuccess } from "../utils/response";

export async function list(req: Request, res: Response) {
  const { status, eventId, search } = req.query;

  const orders = await orderService.listOrders({
    status: status as string | undefined,
    eventId: eventId as string | undefined,
    search: search as string | undefined,
  });

  sendSuccess(res, orders, "Orders retrieved");
}

export async function stats(_req: Request, res: Response) {
  const data = await orderService.getOrderStats();
  sendSuccess(res, data, "Order stats retrieved");
}
