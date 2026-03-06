import type { Request, Response } from "express";
import * as resaleService from "../services/resale.service";
import * as checkoutService from "../services/checkout.service";
import { sendSuccess } from "../utils/response";

export async function listForResale(req: Request, res: Response) {
  const listing = await resaleService.listForResale({
    ...req.body,
    userId: req.user!.userId,
  });
  sendSuccess(res, listing, "Ticket listed for resale", 201);
}

export async function cancelListing(req: Request, res: Response) {
  const listing = await resaleService.cancelListing(req.params.id, req.user!.userId);
  sendSuccess(res, listing, "Listing cancelled");
}

export async function getEventListings(req: Request, res: Response) {
  const listings = await resaleService.getListingsForEvent(req.params.eventId);
  sendSuccess(res, listings, "Resale listings retrieved");
}

export async function buyListing(req: Request, res: Response) {
  const data = await checkoutService.createResaleCheckoutSession({
    listingId: req.params.id,
    capturedFee: req.body.capturedFee,
    userId: req.user!.userId,
  });
  sendSuccess(res, data, "Resale checkout session created");
}
