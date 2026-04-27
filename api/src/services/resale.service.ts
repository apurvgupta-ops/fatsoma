import mongoose from "mongoose";
import Ticket from "../models/Ticket";
import Event from "../models/Event";
import ResaleListing from "../models/ResaleListing";
import { AppError } from "../utils/AppError";

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
    originalPurchasePrice: listing.originalPurchasePrice,
    status: listing.status,
    buyerId: listing.buyerId?.toString() ?? null,
    platformFee: listing.platformFee,
    sellerPayout: listing.sellerPayout,
    organiserRevenue: listing.organiserRevenue,
    sellerRefundId: listing.sellerRefundId ?? null,
    sellerRefundStatus: listing.sellerRefundStatus ?? null,
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

interface ListForResaleInput {
  ticketId: string;
  askingPrice: number;
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

  const batch = event.ticketBatches.find(
    (b: any) => b.name === ticket.ticketBatchName,
  );
  const maxPrice = batch?.basePrice ?? askingPrice;

  if (askingPrice <= 0) {
    throw AppError.badRequest("Asking price must be greater than 0");
  }
  if (askingPrice > maxPrice) {
    throw AppError.badRequest(
      `Asking price cannot exceed current ticket price (£${maxPrice.toFixed(2)})`,
    );
  }

  ticket.status = "listed";
  await ticket.save();

  const listing = await ResaleListing.create({
    ticketId: ticket._id,
    eventId: ticket.eventId,
    sellerId: new mongoose.Types.ObjectId(userId),
    askingPrice,
    originalPurchasePrice: ticket.purchasePrice,
    status: "active",
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
