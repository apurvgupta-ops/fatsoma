import Ticket from "../models/Ticket";
import Event from "../models/Event";
import Order from "../models/Order";
import User from "../models/User";
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
    orderId: ticket.orderId?.toString(),
    eventId: ticket.eventId.toString(),
    userId: ticket.userId?.toString(),
    eventName: ticket.eventName,
    ticketBatchName: ticket.ticketBatchName,
    status: ticket.status,
    purchasePrice: ticket.purchasePrice,
    usedAt:
      ticket.usedAt instanceof Date
        ? ticket.usedAt.toISOString()
        : (ticket.usedAt ?? null),
  };
}

function emptyScanResult(
  reason: TicketScanValidationResult["reason"],
  message: string,
  scannedAt: string,
): TicketScanValidationResult {
  return {
    valid: false,
    reason,
    message,
    scannedAt,
    ticket: null,
    entryWindowCutoff: null,
  };
}

function parseBundleQr(qrCode: string) {
  const parts = qrCode.split(":");
  if (parts.length !== 6 || parts[0] !== "bundle" || parts[1] !== "v1") {
    return null;
  }

  const [, , orderId, eventId, userId, encodedBatchName] = parts;
  if (!orderId || !eventId || !userId || !encodedBatchName) return null;
  const objectIdPattern = /^[a-f\d]{24}$/i;
  if (
    !objectIdPattern.test(orderId) ||
    !objectIdPattern.test(eventId) ||
    !objectIdPattern.test(userId)
  ) {
    return null;
  }

  try {
    return {
      orderId,
      eventId,
      userId,
      ticketBatchName: decodeURIComponent(encodedBatchName),
    };
  } catch {
    return null;
  }
}

async function getEntryWindowCutoff(eventId: any, ticketBatchName: string) {
  const event = (await Event.findById(eventId)
    .select("ticketBatches")
    .lean()) as any;

  if (!event) return { event: null, entryWindowCutoff: null as string | null };

  const batch = event.ticketBatches?.find(
    (b: any) => b.name === ticketBatchName,
  );
  const cutoffDate = batch?.entryWindowCutoff
    ? new Date(batch.entryWindowCutoff)
    : null;
  const entryWindowCutoff =
    cutoffDate && !Number.isNaN(cutoffDate.getTime())
      ? cutoffDate.toISOString()
      : null;

  return { event, entryWindowCutoff };
}

async function validateBundleScan(
  qrCode: string,
  scannedAt: string,
  requestedEventId?: string,
): Promise<TicketScanValidationResult | null> {
  const scannedAtDate = new Date(scannedAt);
  const bundle = parseBundleQr(qrCode);
  if (!bundle) return null;

  if (requestedEventId && bundle.eventId !== requestedEventId) {
    return emptyScanResult(
      "WRONG_EVENT",
      "This ticket bundle is for a different event",
      scannedAt,
    );
  }

  const activeTickets = (await Ticket.find({
    orderId: bundle.orderId,
    eventId: bundle.eventId,
    userId: bundle.userId,
    ticketBatchName: bundle.ticketBatchName,
    status: "active",
  })
    .sort({ createdAt: 1 })
    .lean()) as any[];

  const allBundleTickets = (await Ticket.find({
    orderId: bundle.orderId,
    eventId: bundle.eventId,
    userId: bundle.userId,
    ticketBatchName: bundle.ticketBatchName,
  })
    .sort({ createdAt: 1 })
    .lean()) as any[];

  const sampleTicket = activeTickets[0] ?? allBundleTickets[0];
  if (!sampleTicket) {
    return emptyScanResult(
      "BUNDLE_EMPTY",
      "No tickets found for this bundle",
      scannedAt,
    );
  }

  const { entryWindowCutoff } = await getEntryWindowCutoff(
    sampleTicket.eventId,
    sampleTicket.ticketBatchName,
  );

  const ticketSummary = toScanTicketDTO(sampleTicket);
  const holder = (await User.findById(bundle.userId)
    .select("name email")
    .lean()) as any;
  const order = (await Order.findById(bundle.orderId)
    .select("quantity totalAmount currency")
    .lean()) as any;
  const statusCounts = allBundleTickets.reduce(
    (counts: Record<string, number>, ticket: any) => {
      counts[ticket.status] = (counts[ticket.status] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const bundleDetails = {
    type: "bundle" as const,
    orderId: bundle.orderId,
    userId: bundle.userId,
    holderName: holder?.name ?? null,
    holderEmail: holder?.email ?? null,
    quantity: activeTickets.length,
    originalQuantity: order?.quantity ?? allBundleTickets.length,
    priceEach: Number(sampleTicket.purchasePrice || 0),
    totalPrice:
      Math.round(
        activeTickets.reduce(
          (sum, ticket) => sum + Number(ticket.purchasePrice || 0),
          0,
        ) * 100,
      ) / 100,
    currency: order?.currency ?? null,
    ticketIds: activeTickets.map((ticket) => ticket._id.toString()),
    statusCounts,
  };

  if (entryWindowCutoff && Date.now() > new Date(entryWindowCutoff).getTime()) {
    return {
      valid: false,
      reason: "ENTRY_WINDOW_CLOSED",
      message: "Entry window has closed for this ticket tier",
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff,
      bundle: bundleDetails,
    };
  }

  if (activeTickets.length === 0) {
    return {
      valid: false,
      reason: statusCounts.used > 0 ? "ALREADY_USED" : "BUNDLE_EMPTY",
      message:
        statusCounts.used > 0
          ? "Ticket bundle already scanned"
          : "No active tickets remain in this bundle",
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff,
      bundle: bundleDetails,
    };
  }

  const activeTicketIds = activeTickets.map((ticket) => ticket._id);
  const markUsedResult = await Ticket.updateMany(
    { _id: { $in: activeTicketIds }, status: "active" },
    { $set: { status: "used", usedAt: scannedAtDate } },
  );
  const markedCount = markUsedResult.modifiedCount ?? 0;
  if (markedCount === 0) {
    return {
      valid: false,
      reason: "ALREADY_USED",
      message: "Ticket bundle already scanned",
      scannedAt,
      ticket: ticketSummary,
      entryWindowCutoff,
      bundle: {
        ...bundleDetails,
        quantity: 0,
        totalPrice: 0,
        ticketIds: [],
      },
    };
  }

  const markedTickets = activeTickets.slice(0, markedCount);
  const markedBundleDetails = {
    ...bundleDetails,
    quantity: markedCount,
    totalPrice:
      Math.round(
        markedTickets.reduce(
          (sum, ticket) => sum + Number(ticket.purchasePrice || 0),
          0,
        ) * 100,
      ) / 100,
    ticketIds: markedTickets.map((ticket) => ticket._id.toString()),
    statusCounts: {
      ...statusCounts,
      active: Math.max((statusCounts.active ?? 0) - markedCount, 0),
      used: (statusCounts.used ?? 0) + markedCount,
    },
  };

  return {
    valid: true,
    reason: "VALID",
    message: `Ticket bundle scanned for ${markedCount} ticket${
      markedCount === 1 ? "" : "s"
    }`,
    scannedAt,
    ticket: {
      ...ticketSummary,
      status: "used",
      usedAt: scannedAt,
    },
    entryWindowCutoff,
    bundle: markedBundleDetails,
  };
}

export async function validateTicketScan(
  qrCode: string,
  eventId?: string,
): Promise<TicketScanValidationResult> {
  const scannedAt = new Date().toISOString();
  const scannedAtDate = new Date(scannedAt);
  const bundleResult = await validateBundleScan(qrCode, scannedAt, eventId);
  if (bundleResult) return bundleResult;

  const ticket = (await Ticket.findOne({ qrCode }).lean()) as any;

  if (!ticket) {
    return emptyScanResult("NOT_FOUND", "Ticket not found", scannedAt);
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

  const holder = (await User.findById(ticket.userId)
    .select("name email")
    .lean()) as any;
  const order = (await Order.findById(ticket.orderId)
    .select("quantity totalAmount currency")
    .lean()) as any;
  const { event, entryWindowCutoff } = await getEntryWindowCutoff(
    ticket.eventId,
    ticket.ticketBatchName,
  );

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

  const markedTicket = (await Ticket.findOneAndUpdate(
    { _id: ticket._id, status: "active" },
    { $set: { status: "used", usedAt: scannedAtDate } },
    { new: true },
  ).lean()) as any;

  if (!markedTicket) {
    return {
      valid: false,
      reason: "ALREADY_USED",
      message: "Ticket already used",
      scannedAt,
      ticket: {
        ...ticketSummary,
        status: "used",
        usedAt: scannedAt,
      },
      entryWindowCutoff,
    };
  }

  return {
    valid: true,
    reason: "VALID",
    message: "Ticket scanned for entry",
    scannedAt,
    ticket: toScanTicketDTO(markedTicket),
    entryWindowCutoff,
    holder: {
      userId: ticket.userId?.toString(),
      name: holder?.name ?? null,
      email: holder?.email ?? null,
    },
    order: {
      id: ticket.orderId?.toString(),
      quantity: order?.quantity ?? 1,
      totalAmount: order?.totalAmount ?? ticket.purchasePrice,
      currency: order?.currency ?? null,
    },
  };
}
