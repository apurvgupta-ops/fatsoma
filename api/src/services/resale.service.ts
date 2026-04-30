import mongoose from "mongoose";
import Ticket from "../models/Ticket";
import Event from "../models/Event";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";
import { logPayment } from "../lib/systemLogger";
import { computeResaleTargetBatchInGroup } from "../domain/eventTickets";

function toListingDTO(listing: any) {
  const ticket = listing.ticketId;
  return {
    id: (listing._id ?? listing.id).toString(),
    ticketId:
      typeof ticket === "object" && ticket !== null && "_id" in ticket
        ? String((ticket as any)._id)
        : listing.ticketId?.toString(),
    eventId: listing.eventId?.toString(),
    sellerId: listing.sellerId?.toString(),
    eventName:
      typeof ticket === "object" && ticket !== null
        ? ((ticket as any).eventName ?? null)
        : null,
    ticketBatchName:
      typeof ticket === "object" && ticket !== null
        ? ((ticket as any).ticketBatchName ?? null)
        : null,
    askingPrice: listing.askingPrice,
    originalTicketBatchName: listing.originalTicketBatchName,
    originalPurchasePrice: listing.originalPurchasePrice,
    targetTicketBatchName: listing.targetTicketBatchName,
    reallocationType: listing.reallocationType,
    status: listing.status,
    buyerId: listing.buyerId?.toString() ?? null,
    platformFee: listing.platformFee,
    sellerPayout: listing.sellerPayout,
    organiserRevenue: listing.organiserRevenue,
    sellerRefundId: listing.sellerRefundId ?? null,
    sellerRefundStatus: listing.sellerRefundStatus ?? null,
    sellerPaymentIntentIdAtListing:
      listing.sellerPaymentIntentIdAtListing ?? null,
    createdAt:
      listing.createdAt instanceof Date
        ? listing.createdAt.toISOString()
        : listing.createdAt,
    updatedAt:
      listing.updatedAt instanceof Date
        ? listing.updatedAt.toISOString()
        : (listing.updatedAt ?? null),
  };
}

function toMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

async function getPrimarySoldCounts(eventId: string) {
  const rows = await Ticket.aggregate([
    {
      $match: {
        eventId: toObjectId(eventId),
        status: { $nin: ["cancelled"] },
      },
    },
    {
      $group: {
        _id: {
          $ifNull: ["$primaryInventoryBatchName", "$ticketBatchName"],
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const soldByBatch = new Map<string, number>();
  for (const row of rows) {
    soldByBatch.set(String(row._id), Number(row.count) || 0);
  }
  return soldByBatch;
}

interface ListForResaleInput {
  ticketId: string;
  askingPrice?: number;
  userId: string;
}

export async function listForResale(input: ListForResaleInput) {
  const { ticketId, askingPrice, userId } = input;

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw AppError.badRequest("Invalid ticket ID");
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw AppError.notFound("Ticket not found");
  if (ticket.userId.toString() !== userId) {
    throw AppError.forbidden("You do not own this ticket");
  }
  if (ticket.status !== "active") {
    throw AppError.badRequest(
      "Ticket is not available for listing (current status: " +
        ticket.status +
        ")",
    );
  }

  const event = (await Event.findById(ticket.eventId).lean()) as any;
  if (!event) throw AppError.notFound("Event not found");
  if (!event.allowResale) {
    throw AppError.badRequest("Resale is not allowed for this event");
  }

  const soldByBatch = await getPrimarySoldCounts(ticket.eventId.toString());
  const targetDecision = computeResaleTargetBatchInGroup(
    event,
    ticket.ticketBatchName,
    soldByBatch,
  );
  if (!targetDecision) {
    throw AppError.badRequest("Ticket batch no longer exists on this event");
  }

  const minAskingPrice =
    targetDecision.reallocationType === "same_batch"
      ? Number(ticket.purchasePrice)
      : Number(targetDecision.targetBasePrice);
  if (
    typeof askingPrice === "number" &&
    Number.isFinite(askingPrice) &&
    askingPrice + 0.001 < minAskingPrice
  ) {
    throw AppError.badRequest(
      targetDecision.reallocationType === "same_batch"
        ? `Asking price cannot be below original purchase price (£${minAskingPrice.toFixed(2)})`
        : `Asking price cannot be below target batch price (£${minAskingPrice.toFixed(2)})`,
    );
  }

  const resolvedAskingPrice = toMoney(minAskingPrice);
  const sellerPayout = toMoney(Number(ticket.purchasePrice));
  const organiserRevenue = toMoney(
    Math.max(resolvedAskingPrice - sellerPayout, 0),
  );

  ticket.status = "listed";
  await ticket.save();

  const listing = await ResaleListing.create({
    ticketId: ticket._id,
    eventId: ticket.eventId,
    sellerId: new mongoose.Types.ObjectId(userId),
    askingPrice: resolvedAskingPrice,
    originalTicketBatchName: ticket.ticketBatchName,
    originalPurchasePrice: ticket.purchasePrice,
    targetTicketBatchName: targetDecision.targetTicketBatchName,
    reallocationType: targetDecision.reallocationType,
    sellerPayout,
    organiserRevenue,
    sellerPaymentIntentIdAtListing: ticket.stripePaymentIntentId || undefined,
    status: "active",
  });

  logPayment({
    event: "resale_listing_created",
    outcome: "success",
    type: "resale",
    userId,
    amountGbp: resolvedAskingPrice,
    metadata: {
      listingId: listing._id.toString(),
      ticketId: ticket._id.toString(),
      eventId: ticket.eventId.toString(),
      originalBatch: ticket.ticketBatchName,
      targetBatch: targetDecision.targetTicketBatchName,
      reallocationType: targetDecision.reallocationType,
      sellerPayout,
      organiserRevenue,
    },
  });

  return toListingDTO(listing);
}

export async function cancelListing(listingId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    throw AppError.badRequest("Invalid listing ID");
  }

  const listing = await ResaleListing.findById(listingId);
  if (!listing) throw AppError.notFound("Listing not found");
  if (listing.sellerId.toString() !== userId) {
    throw AppError.forbidden("You do not own this listing");
  }
  if (listing.status !== "active") {
    throw AppError.badRequest("Listing is not active");
  }

  listing.status = "cancelled";
  await listing.save();

  await Ticket.findByIdAndUpdate(listing.ticketId, { status: "active" });

  logPayment({
    event: "resale_listing_cancelled",
    outcome: "success",
    type: "resale",
    userId,
    metadata: {
      listingId: listing._id.toString(),
      ticketId: listing.ticketId.toString(),
      eventId: listing.eventId.toString(),
      originalBatch: listing.originalTicketBatchName,
      targetBatch: listing.targetTicketBatchName,
      reallocationType: listing.reallocationType,
    },
  });

  return toListingDTO(listing);
}

export async function getMyListings(userId: string) {
  const listings = await ResaleListing.find({ sellerId: userId })
    .populate({ path: "ticketId", select: "eventName ticketBatchName" })
    .sort({ updatedAt: -1 })
    .lean();

  return listings.map(toListingDTO);
}

export async function getListingsForEvent(eventId: string) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw AppError.badRequest("Invalid event ID");
  }

  const listings = await ResaleListing.find({
    eventId,
    status: "active",
  })
    .sort({ askingPrice: 1 })
    .lean();

  return listings.map(toListingDTO);
}
