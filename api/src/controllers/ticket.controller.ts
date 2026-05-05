import type { Request, Response } from "express";
import * as ticketService from "../services/ticket.service";
import { sendSuccess } from "../utils/response";
import { AppError } from "../utils/AppError";

export async function getMyTickets(req: Request, res: Response) {
  const tickets = await ticketService.getMyTickets(req.user!.userId);
  sendSuccess(res, tickets, "Tickets retrieved");
}

export async function getTicket(req: Request, res: Response) {
  const ticket = await ticketService.getTicketById(
    req.params.id as string,
    req.user!.userId,
  );
  sendSuccess(res, ticket, "Ticket retrieved");
}

export async function validateTicketScan(req: Request, res: Response) {
  let eventId: string | undefined =
    typeof req.body.eventId === "string" ? req.body.eventId : undefined;
  let gateName: string | undefined;
  if (req.user?.role === "staff") {
    if (!req.user.staffEventId) {
      throw AppError.forbidden(
        "Staff account is not assigned to an event",
      );
    }
    if (!req.user.staffGateName) {
      throw AppError.forbidden("Staff account is not assigned to a gate");
    }
    eventId = req.user.staffEventId;
    gateName = req.user.staffGateName;
  }

  const result = await ticketService.validateTicketScan(
    req.body.qrCode,
    eventId,
    gateName,
  );

  sendSuccess(
    res,
    result,
    result.valid
      ? "Ticket is valid for entry"
      : "Ticket is not valid for entry",
  );
}
