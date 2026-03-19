import { Router } from "express";
import { loginSchema, registerSchema } from "@fatsoma/shared";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as authCtrl from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(authCtrl.register));
authRouter.post("/login", validate(loginSchema), asyncHandler(authCtrl.login));
authRouter.post("/refresh", asyncHandler(authCtrl.refresh));
authRouter.post("/forgot-password", asyncHandler(authCtrl.forgotPassword));
authRouter.post("/reset-password", asyncHandler(authCtrl.resetPassword));
authRouter.get("/me", authenticate, asyncHandler(authCtrl.getMe));
