import { Router } from "express";
import {
  createUserSchema,
  createStaffUserSchema,
  patchUserActiveSchema,
} from "../shared";
import { validate } from "../middleware/validate";
import {
  authenticate,
  requireAdmin,
  requireAdminOrOrganizer,
} from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as userCtrl from "../controllers/user.controller";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
  "/staff",
  requireAdminOrOrganizer,
  asyncHandler(userCtrl.listStaff),
);
userRouter.post(
  "/staff",
  requireAdminOrOrganizer,
  validate(createStaffUserSchema),
  asyncHandler(userCtrl.createStaff),
);
userRouter.patch(
  "/staff/:id/status",
  requireAdminOrOrganizer,
  validate(patchUserActiveSchema),
  asyncHandler(userCtrl.updateStaffStatus),
);
userRouter.delete(
  "/staff/:id",
  requireAdminOrOrganizer,
  asyncHandler(userCtrl.removeStaff),
);

userRouter.use(requireAdmin);

userRouter.get("/", asyncHandler(userCtrl.list));
userRouter.post("/", validate(createUserSchema), asyncHandler(userCtrl.create));
userRouter.patch("/:id/status", asyncHandler(userCtrl.updateStatus));
userRouter.patch("/:id/role", asyncHandler(userCtrl.updateRole));
userRouter.delete("/:id", asyncHandler(userCtrl.remove));

