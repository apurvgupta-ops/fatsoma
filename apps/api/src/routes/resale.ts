import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as resaleCtrl from "../controllers/resale.controller";

export const resaleRouter = Router();

resaleRouter.post("/list", authenticate, asyncHandler(resaleCtrl.listForResale));
resaleRouter.get("/my", authenticate, asyncHandler(resaleCtrl.getMyListings));
resaleRouter.delete("/:id", authenticate, asyncHandler(resaleCtrl.cancelListing));
resaleRouter.get("/event/:eventId", asyncHandler(resaleCtrl.getEventListings));
resaleRouter.post("/:id/buy", authenticate, asyncHandler(resaleCtrl.buyListing));
