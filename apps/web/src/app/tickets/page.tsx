"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { createBrowserClient } from "@/lib/api";
import type { TicketResponse } from "@fatsoma/shared";
import { Ticket, ArrowRight, X, Loader2, AlertCircle } from "lucide-react";

// AlertCircle is used in error div
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type TabId = "active" | "resale" | "history";

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

  const fetchTickets = useCallback(async () => {
    try {
      const client = createBrowserClient();
      const res = await client.getMyTickets();
      if (res.ok && res.data) setTickets(res.data);
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
      fetchTickets();
    } catch (err: any) {
      setActionError(err.message || "Failed to list ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelListing = async (ticket: TicketResponse) => {
    try {
      const client = createBrowserClient();
      const listings = await client.getResaleListings(ticket.eventId);
      const myListing = listings.data?.find((l) => l.ticketId === ticket.id && l.sellerId === user?.id);
      if (!myListing) return;
      await client.cancelResaleListing(myListing.id);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Failed to cancel listing");
    }
  };

  const activeTickets = tickets.filter((t) => t.status === "active");
  const resaleTickets = tickets.filter((t) => t.status === "listed");
  const historyTickets = tickets.filter((t) => ["transferred", "used", "cancelled"].includes(t.status));

  const displayedTickets =
    activeTab === "active" ? activeTickets : activeTab === "resale" ? resaleTickets : historyTickets;

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
            <p className="mt-2 text-sm text-cream/60">Manage your tickets and resale listings</p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "active"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              Active Tickets ({activeTickets.length})
            </button>
            <button
              onClick={() => setActiveTab("resale")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "resale"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              Resale Listings
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "history"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              History ({historyTickets.length})
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {displayedTickets.length === 0 ? (
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
                  onCancelListing={() => handleCancelListing(ticket)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.qrCode)}`;
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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5">
      {/* Valid / status label - top right */}
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
        {/* QR code */}
        <div className="shrink-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-white">
            <Image
              src={qrUrl}
              alt="Ticket QR"
              fill
              unoptimized
              className="object-contain p-1"
            />
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-cream/50" title={ticket.qrCode}>
            {ticket.qrCode.slice(0, 12)}...
          </p>
        </div>

        {/* Event details */}
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

          {/* List for Resale button - bottom right of card */}
          <div className="mt-4 flex justify-end">
            {ticket.status === "active" && ticket.allowResale && (
              <button
                onClick={onListForResale}
                className="rounded-lg bg-cream/10 px-4 py-2 text-sm font-medium text-cream/90 transition hover:bg-cream/15"
              >
                List for Resale
              </button>
            )}
            {ticket.status === "listed" && (
              <button
                onClick={onCancelListing}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                Cancel Listing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
