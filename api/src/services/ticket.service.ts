import Ticket from "../models/Ticket";
import Event from "../models/Event";
import Order from "../models/Order";
import User from "../models/User";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";
import type { TicketScanValidationResult } from "../shared";
import {
  computeResaleTargetBatchInGroup,
  flattenTicketBatchesFromEvent,
} from "../domain/eventTickets";

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

function resolveResaleTargetPrice(
  event: any,
  ticketBatchName: string,
  soldByBatch: Map<string, number>,
) {
  const d = computeResaleTargetBatchInGroup(
    event ?? {},
    ticketBatchName,
    soldByBatch,
  );
  return d ? d.targetBasePrice : 0;
}

function resolveResaleTargetBatch(
  event: any,
  ticketBatchName: string,
  soldByBatch: Map<string, number>,
) {
  const d = computeResaleTargetBatchInGroup(
    event ?? {},
    ticketBatchName,
    soldByBatch,
  );
  if (!d) return null;

  if (d.reallocationType === "same_batch") {
    return {
      name: d.targetTicketBatchName,
      price: d.targetBasePrice,
      isOriginalBatchSoldOut: false,
      originalBatchRemaining: d.originalTierPrimaryRemaining,
    };
  }

  return {
    name: d.targetTicketBatchName,
    price: d.targetBasePrice,
    isOriginalBatchSoldOut: true,
    originalBatchRemaining: 0,
  };
}

async function getSoldCountsByEvent(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, Map<string, number>>();
  const rows = await Ticket.aggregate([
    {
      $match: {
        eventId: {
          $in: eventIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        status: { $nin: ["cancelled"] },
      },
    },
    {
      $group: {
        _id: {
          eventId: "$eventId",
          batch: {
            $ifNull: ["$primaryInventoryBatchName", "$ticketBatchName"],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const result = new Map<string, Map<string, number>>();
  for (const row of rows as any[]) {
    const eventId = String(row._id.eventId);
    if (!result.has(eventId)) result.set(eventId, new Map());
    result.get(eventId)!.set(String(row._id.batch), Number(row.count) || 0);
  }
  return result;
}

export async function getMyTickets(userId: string) {
  const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 }).lean();

  const eventIds = [...new Set(tickets.map((t) => t.eventId.toString()))];
  const events = await Event.find({ _id: { $in: eventIds } }).lean();
  const eventMap = new Map(events.map((e: any) => [e._id.toString(), e]));
  const soldMapByEvent = await getSoldCountsByEvent(eventIds);

  return tickets.map((t) => {
    const event = eventMap.get(t.eventId.toString()) as any;
    const soldByBatch = soldMapByEvent.get(t.eventId.toString()) ?? new Map();
    const targetBatch = resolveResaleTargetBatch(event, t.ticketBatchName, soldByBatch);
    const currentBatchPrice =
      targetBatch?.price ??
      resolveResaleTargetPrice(event, t.ticketBatchName, soldByBatch);
    return {
      ...toTicketDTO(t),
      allowResale: event?.allowResale ?? false,
      currentBatchPrice,
      isCurrentBatchSoldOut: Boolean(targetBatch?.isOriginalBatchSoldOut),
      currentBatchRemaining: Number(targetBatch?.originalBatchRemaining ?? 0),
      resaleTargetBatchName: targetBatch?.name ?? t.ticketBatchName,
      resaleTargetBatchPrice: Number(targetBatch?.price ?? currentBatchPrice),
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
  const soldMapByEvent = await getSoldCountsByEvent([ticket.eventId.toString()]);
  const soldByBatch =
    soldMapByEvent.get(ticket.eventId.toString()) ?? new Map<string, number>();
  const targetBatch = resolveResaleTargetBatch(
    event,
    ticket.ticketBatchName,
    soldByBatch,
  );
  const currentBatchPrice =
    targetBatch?.price ??
    resolveResaleTargetPrice(event, ticket.ticketBatchName, soldByBatch);

  return {
    ...toTicketDTO(ticket),
    allowResale: event?.allowResale ?? false,
    currentBatchPrice,
    isCurrentBatchSoldOut: Boolean(targetBatch?.isOriginalBatchSoldOut),
    currentBatchRemaining: Number(targetBatch?.originalBatchRemaining ?? 0),
    resaleTargetBatchName: targetBatch?.name ?? ticket.ticketBatchName,
    resaleTargetBatchPrice: Number(targetBatch?.price ?? currentBatchPrice),
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

function normalizeGateValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveTicketGateName(event: any, ticketBatchName: string) {
  const groups = Array.isArray(event?.ticketGroups) ? event.ticketGroups : [];
  for (const group of groups) {
    const batches = Array.isArray(group?.batches) ? group.batches : [];
    if (batches.some((batch: any) => batch?.name === ticketBatchName)) {
      return String(group?.title ?? ticketBatchName);
    }
  }
  return ticketBatchName;
}

function gateMatches(staffGateName: string, ticketGateName: string) {
  const staff = normalizeGateValue(staffGateName);
  const ticket = normalizeGateValue(ticketGateName);
  if (!staff || !ticket) return true;
  if (staff === ticket) return true;

  // Allow Male/Female gate to accept either male or female ticket labels.
  if (staff === "malefemale" && (ticket.includes("male") || ticket.includes("female"))) {
    return true;
  }

  return ticket.includes(staff) || staff.includes(ticket);
}

async function getEntryWindowCutoff(eventId: any, ticketBatchName: string) {
  const event = (await Event.findById(eventId)
    .select("ticketGroups ticketBatches")
    .lean()) as any;

  if (!event) return { event: null, entryWindowCutoff: null as string | null };

  const batch = flattenTicketBatchesFromEvent(event).find(
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
  staffGateName?: string,
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

  const { event, entryWindowCutoff } = await getEntryWindowCutoff(
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

  if (staffGateName) {
    const ticketGateName = resolveTicketGateName(
      event,
      sampleTicket.ticketBatchName,
    );
    if (!gateMatches(staffGateName, ticketGateName)) {
      return {
        valid: false,
        reason: "WRONG_GATE",
        message: `Wrong gate. This ticket is for ${ticketGateName}. Please send them to the correct gate and scan again there.`,
        scannedAt,
        ticket: ticketSummary,
        entryWindowCutoff,
        bundle: bundleDetails,
      };
    }
  }

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
  staffGateName?: string,
): Promise<TicketScanValidationResult> {
  const scannedAt = new Date().toISOString();
  const scannedAtDate = new Date(scannedAt);
  const bundleResult = await validateBundleScan(
    qrCode,
    scannedAt,
    eventId,
    staffGateName,
  );
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

  if (staffGateName) {
    const ticketGateName = resolveTicketGateName(event, ticket.ticketBatchName);
    if (!gateMatches(staffGateName, ticketGateName)) {
      return {
        valid: false,
        reason: "WRONG_GATE",
        message: `Wrong gate. This ticket is for ${ticketGateName}. Please send them to the correct gate and scan again there.`,
        scannedAt,
        ticket: ticketSummary,
        entryWindowCutoff,
      };
    }
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
