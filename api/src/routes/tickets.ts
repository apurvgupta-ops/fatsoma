import { Router } from "express";
import { validateTicketScanSchema } from "../shared";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import * as ticketCtrl from "../controllers/ticket.controller";

export const ticketRouter = Router();

ticketRouter.post(
  "/scan/validate",
  authenticate,
  requireAdmin,
  validate(validateTicketScanSchema),
  asyncHandler(ticketCtrl.validateTicketScan),
);
ticketRouter.get("/my", authenticate, asyncHandler(ticketCtrl.getMyTickets));
ticketRouter.get("/:id", authenticate, asyncHandler(ticketCtrl.getTicket));
