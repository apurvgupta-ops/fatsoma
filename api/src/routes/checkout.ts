import { Router, raw } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as checkoutCtrl from "../controllers/checkout.controller";

export const checkoutRouter = Router();

checkoutRouter.post("/create-session", authenticate, asyncHandler(checkoutCtrl.createSession));
checkoutRouter.get("/session/:sessionId", asyncHandler(checkoutCtrl.getSession));
checkoutRouter.post("/session/:sessionId/confirm", asyncHandler(checkoutCtrl.confirmSession));
checkoutRouter.post("/webhook", raw({ type: "application/json" }), asyncHandler(checkoutCtrl.webhook));
