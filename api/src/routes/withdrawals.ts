import { Router } from "express";
import { authenticate, requireAdmin, requireAdminOrOrganizer } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as withdrawalCtrl from "../controllers/withdrawal.controller";

export const withdrawalRouter = Router();

withdrawalRouter.get(
  "/balance",
  authenticate,
  requireAdminOrOrganizer,
  asyncHandler(withdrawalCtrl.getBalance),
);
withdrawalRouter.get(
  "/",
  authenticate,
  requireAdminOrOrganizer,
  asyncHandler(withdrawalCtrl.list),
);
withdrawalRouter.post(
  "/",
  authenticate,
  requireAdminOrOrganizer,
  asyncHandler(withdrawalCtrl.create),
);
withdrawalRouter.patch(
  "/:id/approve",
  authenticate,
  requireAdmin,
  asyncHandler(withdrawalCtrl.approve),
);
withdrawalRouter.patch(
  "/:id/reject",
  authenticate,
  requireAdmin,
  asyncHandler(withdrawalCtrl.reject),
);
