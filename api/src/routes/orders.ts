import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as orderCtrl from "../controllers/order.controller";

export const orderRouter = Router();

orderRouter.get("/my", authenticate, asyncHandler(orderCtrl.myOrders));
orderRouter.get("/", authenticate, requireAdmin, asyncHandler(orderCtrl.list));
orderRouter.get("/stats", authenticate, requireAdmin, asyncHandler(orderCtrl.stats));
