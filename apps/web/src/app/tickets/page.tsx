"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { createBrowserClient } from "@/lib/api";
import type { TicketResponse, ResaleListingResponse } from "@fatsoma/shared";
import { Ticket, ArrowRight, X, Loader2, AlertCircle, Check, ZoomIn, DollarSign } from "lucide-react";

// AlertCircle is used in error div
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type TabId = "active" | "resale" | "sold" | "history";

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("active");

  const [resaleModal, setResaleModal] = useState<TicketResponse | null>(null);
  const [askingPrice, setAskingPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState<TicketResponse | null>(null);
  const [soldListings, setSoldListings] = useState<ResaleListingResponse[]>([]);

  const fetchTickets = useCallback(async () => {
    try {
      const client = createBrowserClient();
      const [ticketRes, listingRes] = await Promise.all([
        client.getMyTickets(),
        client.getMyResaleListings(),
      ]);
      if (ticketRes.ok && ticketRes.data) setTickets(ticketRes.data);
      if (listingRes.ok && listingRes.data) setSoldListings(listingRes.data.filter((l) => l.status === "sold"));
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/tickets");
      return;
    }
    fetchTickets();
  }, [user, authLoading, router, fetchTickets]);

  const handleListForResale = async () => {
    if (!resaleModal) return;
    const price = parseFloat(askingPrice);
    if (isNaN(price) || price <= 0) {
      setActionError("Please enter a valid price");
      return;
    }
    if (price > resaleModal.currentBatchPrice) {
      setActionError(`Price cannot exceed current ticket price (£${resaleModal.currentBatchPrice.toFixed(2)})`);
      return;
    }

    setSubmitting(true);
    setActionError("");
    try {
      const client = createBrowserClient();
      await client.listTicketForResale({ ticketId: resaleModal.id, askingPrice: price });
      setResaleModal(null);
      setAskingPrice("");
      setSuccessMessage("Ticket listed for resale successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
      fetchTickets();
    } catch (err: any) {
      setActionError(err.message || "Failed to list ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelListing = async (ticket: TicketResponse) => {
    setCancelConfirm(null);
    try {
      const client = createBrowserClient();
      const listings = await client.getResaleListings(ticket.eventId);
      const myListing = listings.data?.find((l) => l.ticketId === ticket.id && l.sellerId === user?.id);
      if (!myListing) return;
      await client.cancelResaleListing(myListing.id);
      setSuccessMessage("Resale listing cancelled successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Failed to cancel listing");
    }
  };

  const activeTickets = tickets.filter((t) => t.status === "active");
  const resaleTickets = tickets.filter((t) => t.status === "listed");
  const historyTickets = tickets.filter((t) => ["transferred", "used", "cancelled"].includes(t.status));

  const displayedTickets =
    activeTab === "active"
      ? activeTickets
      : activeTab === "resale"
        ? resaleTickets
        : activeTab === "history"
          ? historyTickets
          : [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-cream/90">
      <Header />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/10 blur-[160px]" />

        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="mb-10 text-center">
            <h1 className="font-serif text-4xl font-bold text-cream sm:text-5xl">My Tickets</h1>
            <p className="mt-2 text-sm text-cream/60">Manage your tickets and listings</p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "active"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              Active Tickets ({activeTickets.length})
            </button>
            <button
              onClick={() => setActiveTab("resale")}
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "resale"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
             On <span className="text-gold">the list</span>
            </button>
            <button
              onClick={() => setActiveTab("sold")}
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "sold"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              History ({soldListings.length})
            </button>
            {/* <button
              onClick={() => setActiveTab("history")}
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "history"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              History ({historyTickets.length})
            </button> */}
          </div>

          {successMessage && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
              <Check className="h-4 w-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {activeTab === "sold" ? (
            soldListings.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface/40 p-12 text-center">
                <DollarSign className="mx-auto mb-4 h-12 w-12 text-cream/30" />
                <h2 className="mb-2 text-lg font-semibold text-cream/90">No sold tickets</h2>
                <p className="mb-6 text-sm text-cream/60">
                  When your resale tickets are purchased, they&apos;ll appear here with payout details.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {soldListings.map((listing) => (
                  <SoldListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )
          ) : displayedTickets.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface/40 p-12 text-center">
              <Ticket className="mx-auto mb-4 h-12 w-12 text-cream/30" />
              <h2 className="mb-2 text-lg font-semibold text-cream/90">
                {activeTab === "active" && "No active tickets"}
                {activeTab === "resale" && "No resale listings"}
                {activeTab === "history" && "No history yet"}
              </h2>
              <p className="mb-6 text-sm text-cream/60">
                {activeTab === "active" && "Browse events and purchase tickets to see them here."}
                {activeTab === "resale" && "List your active tickets for resale."}
                {activeTab === "history" && "Your transferred or used tickets will appear here."}
              </p>
              {activeTab === "active" && (
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-void transition hover:bg-gold-light"
                >
                  Browse Events <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onListForResale={() => {
                    setResaleModal(ticket);
                    setAskingPrice(String(ticket.purchasePrice));
                    setActionError("");
                  }}
                  onCancelListing={() => setCancelConfirm(ticket)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-void p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-cream">Cancel Resale Listing?</h3>
            <p className="mb-5 text-sm text-cream/60">
              Are you sure you want to cancel the resale listing for <span className="font-medium text-cream/80">{cancelConfirm.eventName}</span>? The ticket will be moved back to your active tickets.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5"
              >
                Keep Listed
              </button>
              <button
                onClick={() => handleCancelListing(cancelConfirm)}
                className="flex-1 cursor-pointer rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/30"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resale Modal */}
      {resaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-void p-6 shadow-2xl">
            <button
              onClick={() => setResaleModal(null)}
              className="absolute right-4 top-4 text-cream/60 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-1 text-lg font-semibold text-cream">List Ticket for Resale</h3>
            <p className="mb-5 text-sm text-cream/60">
              {resaleModal.eventName} — {resaleModal.ticketBatchName}
            </p>

            <div className="mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-cream/60">Your purchase price</span>
                <span className="font-medium text-cream">£{resaleModal.purchasePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cream/60">Max resale price</span>
                <span className="font-medium text-amber-400">£{resaleModal.currentBatchPrice.toFixed(2)}</span>
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-cream/90">Asking Price (£)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={resaleModal.currentBatchPrice}
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              className="mb-4 w-full rounded-xl border border-border bg-white/5 px-4 py-2.5 text-cream outline-none focus:border-gold"
            />

            {actionError && <p className="mb-3 text-sm text-red-400">{actionError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setResaleModal(null)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleListForResale}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-void transition hover:bg-gold-light disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                List for £{parseFloat(askingPrice || "0").toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  onListForResale,
  onCancelListing,
}: {
  ticket: TicketResponse;
  onListForResale: () => void;
  onCancelListing: () => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.qrCode)}`;
  const qrUrlLarge = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.qrCode)}`;
  const venue = [ticket.venueName, ticket.city].filter(Boolean).join(", ");
  const dateStr = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5">
        <div className="absolute right-4 top-4">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
              ticket.status === "active"
                ? "bg-emerald-500/20 text-emerald-400"
                : ticket.status === "listed"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-cream/10 text-cream/60"
            }`}
          >
            {ticket.status === "active" ? "Valid" : ticket.status}
          </span>
        </div>

        <div className="flex gap-5">
          <div className="shrink-0">
            <button
              onClick={() => setShowQr(true)}
              className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border border-border bg-white transition hover:border-gold/50"
            >
              <Image
                src={qrUrl}
                alt="Ticket QR"
                fill
                unoptimized
                className="object-contain p-1"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                <ZoomIn className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
              </div>
            </button>
            <p className="mt-1 truncate font-mono text-[10px] text-cream/50" title={ticket.qrCode}>
              {ticket.qrCode.slice(0, 12)}...
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <Link
              href={`/events/${ticket.eventId}`}
              className="block text-base font-semibold text-cream transition hover:text-gold"
            >
              {ticket.eventName}
            </Link>
            {venue && <p className="mt-0.5 text-sm text-cream/60">{venue}</p>}
            <p className="mt-1 text-sm text-cream/60">
              {dateStr} · {ticket.ticketBatchName} · £{ticket.purchasePrice.toFixed(2)}
            </p>

            <div className="mt-4 flex justify-end">
              {ticket.status === "active" && ticket.allowResale && (
                <button
                  onClick={onListForResale}
                  className="cursor-pointer rounded-lg bg-cream/10 px-4 py-2 text-sm font-medium text-cream/90 transition hover:bg-cream/15"
                >
                 Pass it <span className="text-gold">on the list</span>
                </button>
              )}
              {ticket.status === "listed" && (
                <button
                  onClick={onCancelListing}
                  className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                >
                  Cancel Listing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-border bg-void p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQr(false)}
              className="absolute right-4 top-4 cursor-pointer text-cream/60 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-1 text-center text-lg font-semibold text-cream">Your Ticket QR Code</h3>
            <p className="mb-4 text-center text-sm text-cream/60">{ticket.eventName}</p>
            <div className="mx-auto h-64 w-64 overflow-hidden rounded-xl border border-border bg-white p-2">
              <div className="relative h-full w-full">
                <Image
                  src={qrUrlLarge}
                  alt="Ticket QR Code"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </div>
            <p className="mt-3 text-center font-mono text-xs text-cream/50">{ticket.qrCode}</p>
            <p className="mt-1 text-center text-xs text-cream/40">
              {ticket.ticketBatchName} · £{ticket.purchasePrice.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SoldListingCard({ listing }: { listing: ResaleListingResponse }) {
  const soldDate = listing.updatedAt
    ? new Date(listing.updatedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const refundLabel =
    listing.sellerRefundStatus === "succeeded"
      ? "Refunded"
      : listing.sellerRefundStatus === "pending"
        ? "Processing"
        : listing.sellerRefundStatus === "failed"
          ? "Refund Failed"
          : "Pending";

  const refundColor =
    listing.sellerRefundStatus === "succeeded"
      ? "bg-emerald-500/20 text-emerald-400"
      : listing.sellerRefundStatus === "pending"
        ? "bg-amber-500/20 text-amber-400"
        : listing.sellerRefundStatus === "failed"
          ? "bg-red-500/20 text-red-400"
          : "bg-cream/10 text-cream/60";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5">
      <div className="absolute right-4 top-4">
        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
          Sold
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <Link
            href={`/events/${listing.eventId}`}
            className="text-base font-semibold text-cream transition hover:text-gold"
          >
            Event #{listing.eventId.slice(-6)}
          </Link>
          {soldDate && <p className="mt-0.5 text-sm text-cream/60">Sold on {soldDate}</p>}
        </div>

        <div className="rounded-xl border border-border bg-void/50 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-cream/50">Sale Price</p>
              <p className="font-semibold text-cream">£{listing.askingPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-cream/50">Original Price</p>
              <p className="font-semibold text-cream">£{listing.originalPurchasePrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-cream/50">Your Payout</p>
              <p className="font-semibold text-emerald-400">£{listing.sellerPayout.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-cream/50">Payout Status</p>
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${refundColor}`}>
                {refundLabel}
              </span>
            </div>
          </div>
        </div>

        {listing.sellerRefundStatus === "succeeded" && (
          <p className="text-xs text-cream/40">
            Refund sent to your original payment method. It may take 5–10 business days to appear.
          </p>
        )}
        {listing.sellerRefundStatus === "failed" && (
          <p className="text-xs text-red-400/80">
            The automatic refund could not be processed. Please contact support for assistance.
          </p>
        )}
      </div>
    </div>
  );
}
