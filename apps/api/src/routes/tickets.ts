import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import * as ticketCtrl from "../controllers/ticket.controller";

export const ticketRouter = Router();

ticketRouter.get("/my", authenticate, asyncHandler(ticketCtrl.getMyTickets));
ticketRouter.get("/:id", authenticate, asyncHandler(ticketCtrl.getTicket));
