import type { Request, Response } from "express";
import * as ticketService from "../services/ticket.service";
import { sendSuccess } from "../utils/response";

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
  const result = await ticketService.validateTicketScan(
    req.body.qrCode,
    req.body.eventId,
  );

  sendSuccess(
    res,
    result,
    result.valid
      ? "Ticket is valid for entry"
      : "Ticket is not valid for entry",
  );
}
