import Ticket from "../models/Ticket";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";
import type { TicketScanValidationResult } from "../shared";

function toTicketDTO(ticket: any) {
  return {
    id: (ticket._id ?? ticket.id).toString(),
    orderId: ticket.orderId?.toString(),
    eventId: ticket.eventId?.toString(),
    userId: ticket.userId?.toString(),
    eventName: ticket.eventName,
    ticketBatchName: ticket.ticketBatchName,
    purchasePrice: ticket.purchasePrice,
    originalPrice: ticket.originalPrice,
    status: ticket.status,
    qrCode: ticket.qrCode,
    allowResale: false,
    currentBatchPrice: 0,
    createdAt:
      ticket.createdAt instanceof Date
        ? ticket.createdAt.toISOString()
        : ticket.createdAt,
    updatedAt:
      ticket.updatedAt instanceof Date
        ? ticket.updatedAt.toISOString()
        : ticket.updatedAt,
  };
}

export async function getMyTickets(userId: string) {
  const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 }).lean();

  const eventIds = [...new Set(tickets.map((t) => t.eventId.toString()))];
  const events = await Event.find({ _id: { $in: eventIds } }).lean();
  const eventMap = new Map(events.map((e: any) => [e._id.toString(), e]));

  return tickets.map((t) => {
    const event = eventMap.get(t.eventId.toString()) as any;
    const batch = event?.ticketBatches?.find(
      (b: any) => b.name === t.ticketBatchName,
    );
    return {
      ...toTicketDTO(t),
      allowResale: event?.allowResale ?? false,
      currentBatchPrice: batch?.basePrice ?? 0,
      eventDate: event?.eventDate?.toISOString?.() ?? null,
      eventImage: event?.eventImage ?? null,
      venueName: event?.venueName ?? null,
      city: event?.city ?? null,
    };
  });
}

export async function getTicketById(ticketId: string, userId: string) {
  const ticket = (await Ticket.findById(ticketId).lean()) as any;
  if (!ticket) throw AppError.notFound("Ticket not found");
  if (ticket.userId.toString() !== userId) {
    throw AppError.forbidden("You do not own this ticket");
  }

  const event = (await Event.findById(ticket.eventId).lean()) as any;
  const batch = event?.ticketBatches?.find(
    (b: any) => b.name === ticket.ticketBatchName,
  );

  return {
    ...toTicketDTO(ticket),
    allowResale: event?.allowResale ?? false,
    currentBatchPrice: batch?.basePrice ?? 0,
    eventDate: event?.eventDate?.toISOString?.() ?? null,
    eventImage: event?.eventImage ?? null,
    venueName: event?.venueName ?? null,
    city: event?.city ?? null,
  };
}

function toScanTicketDTO(ticket: any) {
  return {
    id: ticket._id.toString(),
    eventId: ticket.eventId.toString(),
    eventName: ticket.eventName,
    ticketBatchName: ticket.ticketBatchName,
    status: ticket.status,
    purchasePrice: ticket.purchasePrice,
  };
}

export async function validateTicketScan(
  qrCode: string,
  eventId?: string,
): Promise<TicketScanValidationResult> {
  const scannedAt = new Date().toISOString();
  const ticket = (await Ticket.findOne({ qrCode }).lean()) as any;

  if (!ticket) {
    return {
      valid: false,
      reason: "NOT_FOUND",
      message: "Ticket not found",
      scannedAt,
      ticket: null,
      entryWindowCutoff: null,
    };
  }

  const ticketSummary = toScanTicketDTO(ticket);

  if (eventId && ticket.eventId.toString() !== eventId) {
    return {
      valid: false,
      reason: "WRONG_EVENT",
      message: "This ticket is for a different event",
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff: null,
    };
  }

  if (ticket.status === "used") {
    return {
      valid: false,
      reason: "ALREADY_USED",
      message: "Ticket already used",
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff: null,
    };
  }

  if (ticket.status !== "active") {
    return {
      valid: false,
      reason: "TICKET_NOT_ACTIVE",
      message: `Ticket is ${ticket.status}`,
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff: null,
    };
  }

  const event = (await Event.findById(ticket.eventId)
    .select("ticketBatches")
    .lean()) as any;

  if (!event) {
    return {
      valid: false,
      reason: "NOT_FOUND",
      message: "Event not found for this ticket",
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff: null,
    };
  }

  const batch = event.ticketBatches?.find(
    (b: any) => b.name === ticket.ticketBatchName,
  );
  const cutoffDate = batch?.entryWindowCutoff
    ? new Date(batch.entryWindowCutoff)
    : null;
  const entryWindowCutoff =
    cutoffDate && !Number.isNaN(cutoffDate.getTime())
      ? cutoffDate.toISOString()
      : null;

  if (entryWindowCutoff && Date.now() > new Date(entryWindowCutoff).getTime()) {
    return {
      valid: false,
      reason: "ENTRY_WINDOW_CLOSED",
      message: "Entry window has closed for this ticket tier",
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff,
    };
  }

  return {
    valid: true,
    reason: "VALID",
    message: "Ticket is valid for entry",
    scannedAt,
    ticket: ticketSummary,
    entryWindowCutoff,
  };
}
