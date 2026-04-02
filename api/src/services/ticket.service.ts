import Ticket from "../models/Ticket";
import Event from "../models/Event";
import { AppError } from "../utils/AppError";

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
    createdAt: ticket.createdAt instanceof Date
      ? ticket.createdAt.toISOString()
      : ticket.createdAt,
    updatedAt: ticket.updatedAt instanceof Date
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
    const batch = event?.ticketBatches?.find((b: any) => b.name === t.ticketBatchName);
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
  const ticket = await Ticket.findById(ticketId).lean() as any;
  if (!ticket) throw AppError.notFound("Ticket not found");
  if (ticket.userId.toString() !== userId) {
    throw AppError.forbidden("You do not own this ticket");
  }

  const event = (await Event.findById(ticket.eventId).lean()) as any;
  const batch = event?.ticketBatches?.find((b: any) => b.name === ticket.ticketBatchName);

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
