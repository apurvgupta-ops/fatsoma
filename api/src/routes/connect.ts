import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as connectCtrl from "../controllers/connect.controller";

export const connectRouter = Router();

connectRouter.post(
  "/stripe/account",
  authenticate,
  asyncHandler(connectCtrl.createOrRetrieve),
);
connectRouter.post(
  "/stripe/onboarding-link",
  authenticate,
  asyncHandler(connectCtrl.onboardingLink),
);
connectRouter.get(
  "/stripe/status",
  authenticate,
  asyncHandler(connectCtrl.status),
);

