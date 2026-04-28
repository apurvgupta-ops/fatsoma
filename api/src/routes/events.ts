import { Router } from "express";
import { assignEventOwnerSchema, createEventSchema } from "../shared";
import { validate } from "../middleware/validate";
import { authenticate, requireAdmin, requireAdminOrOrganizer } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as eventCtrl from "../controllers/event.controller";

export const eventRouter = Router();

eventRouter.get("/published", asyncHandler(eventCtrl.getPublished));
eventRouter.get("/", authenticate, requireAdminOrOrganizer, asyncHandler(eventCtrl.getAll));
eventRouter.get("/:id", authenticate, requireAdminOrOrganizer, asyncHandler(eventCtrl.getOne));
eventRouter.post("/", authenticate, requireAdminOrOrganizer, validate(createEventSchema), asyncHandler(eventCtrl.create));
eventRouter.put("/:id", authenticate, requireAdminOrOrganizer, asyncHandler(eventCtrl.update));
eventRouter.patch("/:id/status", authenticate, requireAdminOrOrganizer, asyncHandler(eventCtrl.updateStatus));
eventRouter.patch("/:id/owner", authenticate, requireAdmin, validate(assignEventOwnerSchema), asyncHandler(eventCtrl.assignOwner));
eventRouter.delete("/:id", authenticate, requireAdminOrOrganizer, asyncHandler(eventCtrl.remove));

