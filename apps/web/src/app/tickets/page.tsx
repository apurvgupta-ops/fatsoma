"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createBrowserClient } from "@/lib/api";
import type { TicketResponse } from "@fatsoma/shared";
import {
  Ticket,
  QrCode,
  Tag,
  Calendar,
  MapPin,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  listed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  transferred: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  used: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const myListing = listings.data?.find(
        (l) => l.ticketId === ticket.id && l.sellerId === user?.id,
      );
      if (!myListing) return;
      await client.cancelResaleListing(myListing.id);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Failed to cancel listing");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
          <Ticket className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">My Tickets</h1>
          <p className="text-sm text-zinc-500">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-zinc-950/60 p-12 text-center">
          <Ticket className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
          <h2 className="mb-2 text-lg font-semibold text-zinc-300">No tickets yet</h2>
          <p className="mb-6 text-sm text-zinc-600">
            Browse events and purchase tickets to see them here.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Explore Events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/60 p-5 transition hover:border-white/10"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/events/${ticket.eventId}`}
                      className="text-lg font-semibold text-white transition hover:text-purple-300"
                    >
                      {ticket.eventName}
                    </Link>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[ticket.status] || STATUS_STYLES.active}`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      {ticket.ticketBatchName}
                    </span>
                    {ticket.eventDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(ticket.eventDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {ticket.venueName && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {ticket.venueName}{ticket.city ? `, ${ticket.city}` : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-400">
                      Paid: <span className="font-semibold text-white">£{ticket.purchasePrice.toFixed(2)}</span>
                    </span>
                    {ticket.originalPrice !== ticket.purchasePrice && (
                      <span className="text-zinc-600">
                        Original: £{ticket.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <QrCode className="h-8 w-8 text-zinc-500" />
                  </div>

                  {ticket.status === "active" && ticket.allowResale && (
                    <button
                      onClick={() => {
                        setResaleModal(ticket);
                        setAskingPrice(String(ticket.purchasePrice));
                        setActionError("");
                      }}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 transition hover:bg-amber-500/20"
                    >
                      List for Resale
                    </button>
                  )}

                  {ticket.status === "listed" && (
                    <button
                      onClick={() => handleCancelListing(ticket)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                    >
                      Cancel Listing
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resale Modal */}
      {resaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <button
              onClick={() => setResaleModal(null)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-1 text-lg font-semibold text-white">List Ticket for Resale</h3>
            <p className="mb-5 text-sm text-zinc-500">
              {resaleModal.eventName} — {resaleModal.ticketBatchName}
            </p>

            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Your purchase price</span>
                <span className="font-medium text-white">£{resaleModal.purchasePrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Max resale price</span>
                <span className="font-medium text-amber-400">£{resaleModal.currentBatchPrice.toFixed(2)}</span>
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Asking Price (£)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={resaleModal.currentBatchPrice}
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-purple-500"
            />

            {actionError && (
              <p className="mb-3 text-sm text-red-400">{actionError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setResaleModal(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleListForResale}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
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
