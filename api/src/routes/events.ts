import { Router } from "express";
import { createEventSchema } from "../shared";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as eventCtrl from "../controllers/event.controller";

export const eventRouter = Router();

eventRouter.get("/published", asyncHandler(eventCtrl.getPublished));
eventRouter.get("/", authenticate, asyncHandler(eventCtrl.getAll));
eventRouter.get("/:id", authenticate, asyncHandler(eventCtrl.getOne));
eventRouter.post("/", authenticate, validate(createEventSchema), asyncHandler(eventCtrl.create));
eventRouter.put("/:id", authenticate, asyncHandler(eventCtrl.update));
eventRouter.patch("/:id/status", authenticate, asyncHandler(eventCtrl.updateStatus));
eventRouter.delete("/:id", authenticate, asyncHandler(eventCtrl.remove));
