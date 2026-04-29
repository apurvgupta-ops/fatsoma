import { Router } from "express";
import { authenticate, requireAdminOrOrganizer } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as orderCtrl from "../controllers/order.controller";

export const orderRouter = Router();

orderRouter.get("/my", authenticate, asyncHandler(orderCtrl.myOrders));
orderRouter.get(
  "/",
  authenticate,
  requireAdminOrOrganizer,
  asyncHandler(orderCtrl.list),
);
orderRouter.get(
  "/stats",
  authenticate,
  requireAdminOrOrganizer,
  asyncHandler(orderCtrl.stats),
);
