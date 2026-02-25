import { Router } from "express";
import { createUserSchema } from "@fatsoma/shared";
import { validate } from "../middleware/validate";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as userCtrl from "../controllers/user.controller";

export const userRouter = Router();

userRouter.use(authenticate, requireAdmin);

userRouter.get("/", asyncHandler(userCtrl.list));
userRouter.post("/", validate(createUserSchema), asyncHandler(userCtrl.create));
userRouter.patch("/:id/status", asyncHandler(userCtrl.updateStatus));
userRouter.patch("/:id/role", asyncHandler(userCtrl.updateRole));
userRouter.delete("/:id", asyncHandler(userCtrl.remove));
