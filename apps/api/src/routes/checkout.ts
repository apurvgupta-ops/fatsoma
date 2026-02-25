import { Router, raw } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as checkoutCtrl from "../controllers/checkout.controller";

export const checkoutRouter = Router();

checkoutRouter.post("/create-session", asyncHandler(checkoutCtrl.createSession));
checkoutRouter.get("/session/:sessionId", asyncHandler(checkoutCtrl.getSession));
checkoutRouter.post("/webhook", raw({ type: "application/json" }), asyncHandler(checkoutCtrl.webhook));
