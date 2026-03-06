"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPublicClient, createBrowserClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { EventResponse, TicketBatch, ResaleListingResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock,
  Ticket,
  ShoppingCart,
  Loader2,
  Navigation,
  Building2,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Lock,
  RefreshCw,
  Tag,
  Percent,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getPublishedEvents()
      .then((res) => {
        if (res.ok && res.data) {
          const found = res.data.find((e) => e.id === eventId);
          if (found) setEvent(found);
          else setError("Event not found");
        }
      })
      .catch(() => setError("Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f0f0f]">
        <p className="text-lg text-zinc-400">{error || "Event not found"}</p>
        <Link href="/" className="text-sm text-purple-400 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  const isPlaceholder = event.eventImage.startsWith("placeholder-");
  const imageUrl = isPlaceholder
    ? `https://placehold.co/1200x500/1a1a1a/9333ea.png?text=${encodeURIComponent(event.eventName)}`
    : event.eventImage.startsWith("/uploads/")
      ? `${API_URL}${event.eventImage}`
      : event.eventImage;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-purple-500/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-blue-500/15 blur-[160px]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to events
          </Link>

          {/* Hero Image */}
          <div className="relative mb-8 aspect-21/9 overflow-hidden rounded-3xl border border-white/10">
            <Image
              src={imageUrl}
              alt={event.eventName}
              fill
              priority
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="mb-2 inline-block rounded-full border border-white/20 bg-zinc-900/70 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
                {event.eventCategory}
              </span>
              <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {event.eventName}
              </h1>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left — Details */}
            <div className="space-y-6 lg:col-span-2">
              {/* Info Row */}
              <div className="flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
                <InfoChip icon={<CalendarDays className="h-4 w-4" />} label="Date" value={new Date(event.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
                <InfoChip icon={<Clock className="h-4 w-4" />} label="Time" value={`${event.startTime} — ${event.endTime}`} />
                <InfoChip icon={<MapPin className="h-4 w-4" />} label="Venue" value={`${event.venueName}, ${event.city}`} />
                <InfoChip icon={<Ticket className="h-4 w-4" />} label="Tickets" value={`${event.totalTickets.toLocaleString()} available`} />
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
                <h2 className="mb-3 text-lg font-semibold text-white">About This Event</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                  {event.eventDescription}
                </p>
              </div>

              {/* Venue */}
              <VenueCard event={event} />

              {/* Resale Listings */}
              {event.allowResale && <ResaleListingsSection eventId={event.id} eventName={event.eventName} />}
            </div>

            {/* Right — Ticket Purchase */}
            <div className="space-y-6">
              <TicketPurchasePanel event={event} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Ticket Purchase Panel ── */

function TicketPurchasePanel({ event }: { event: EventResponse }) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<TicketBatch>(event.ticketBatches[0]);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const feePerTicket = Math.round(selectedBatch.basePrice * (BOOKING_FEE_PERCENT / 100) * 100) / 100;
  const baseTotal = selectedBatch.basePrice * quantity;
  const feeTotal = Math.round(feePerTicket * quantity * 100) / 100;
  const grandTotal = Math.round((baseTotal + feeTotal) * 100) / 100;

  const handleBuyNow = useCallback(async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }

    setBuyError(null);
    setBuying(true);

    try {
      const client = createBrowserClient();
      const res = await client.createCheckoutSession({
        eventId: event.id,
        batchName: selectedBatch.name,
        quantity,
        capturedFee: feePerTicket,
      });

      if (res.ok && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setBuyError(res.message || "Failed to start checkout");
        setBuying(false);
      }
    } catch (err: unknown) {
      setBuyError(err instanceof Error ? err.message : "Checkout failed");
      setBuying(false);
    }
  }, [event.id, selectedBatch.name, quantity, feePerTicket, user, router]);

  return (
    <div className="sticky top-8 space-y-4">
      {/* Ticket Selection */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
          <Ticket className="h-5 w-5 text-purple-400" /> Select Tickets
        </h3>

        {/* Batch Selection */}
        <div className="mb-4 space-y-2">
          {event.ticketBatches.map((batch) => {
            const batchRemaining = batch.remaining ?? batch.quantity;
            const soldOut = batchRemaining <= 0;
            return (
              <button
                key={batch.name}
                onClick={() => {
                  if (!soldOut) {
                    setSelectedBatch(batch);
                    if (quantity > batchRemaining) setQuantity(Math.max(1, batchRemaining));
                  }
                }}
                disabled={soldOut}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  soldOut
                    ? "cursor-not-allowed border-white/5 bg-white/2 opacity-50"
                    : selectedBatch.name === batch.name
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-white">{batch.name}</p>
                  <p className="text-xs text-zinc-500">
                    {soldOut ? "Sold out" : `${batchRemaining} remaining`}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-zinc-200">
                  £{batch.basePrice.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-lg font-bold text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(Math.min(10, (selectedBatch.remaining ?? selectedBatch.quantity)), q + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="mb-5 space-y-2 rounded-xl border border-white/5 bg-zinc-900/40 p-4 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>{selectedBatch.name} × {quantity}</span>
            <span className="font-mono">£{baseTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span className="flex items-center gap-1">
              Booking fee
              <span className="inline-flex items-center gap-0.5 rounded bg-purple-500/20 px-1 py-0.5 text-[10px] font-semibold text-purple-300">
                <Percent className="h-2.5 w-2.5" />
                {BOOKING_FEE_PERCENT}%
              </span>
              × {quantity}
            </span>
            <span className="font-mono">£{feeTotal.toFixed(2)}</span>
          </div>
          <div className="border-t border-white/10 pt-2">
            <div className="flex justify-between font-semibold text-white">
              <span>Total</span>
              <span className="font-mono text-lg">£{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {buyError && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {buyError}
          </div>
        )}

        {!user && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-300/90">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Please sign in to purchase tickets
          </div>
        )}

        <button
          onClick={handleBuyNow}
          disabled={buying || (selectedBatch.remaining ?? selectedBatch.quantity) <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {buying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to Stripe...
            </>
          ) : !user ? (
            <>
              <Lock className="h-4 w-4" /> Sign in to Buy — £{grandTotal.toFixed(2)}
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Buy Now — £{grandTotal.toFixed(2)}
            </>
          )}
        </button>

        <p className="mt-3 text-center text-[10px] text-zinc-600">
          Secure checkout via Stripe · {BOOKING_FEE_PERCENT}% platform booking fee
        </p>
      </div>
    </div>
  );
}

/* ── Venue Card ── */

function VenueCard({ event }: { event: EventResponse }) {
  const [copied, setCopied] = useState(false);
  const fullAddress = `${event.addressLine}, ${event.city}, ${event.postcode}, ${event.country}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mapsSearchUrl = event.mapsLink ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
      {/* Map-style header with gradient */}
      <div className="relative h-36 overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.15)_0%,transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Animated pin */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute -inset-4 animate-ping rounded-full bg-purple-500/20" />
            <div className="absolute -inset-2 rounded-full bg-purple-500/10" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Decorative grid lines */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-0 h-full w-px bg-white/3" />
          <div className="absolute left-2/4 top-0 h-full w-px bg-white/3" />
          <div className="absolute left-3/4 top-0 h-full w-px bg-white/3" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/3" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/3" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Building2 className="h-4.5 w-4.5 text-purple-400" />
              {event.venueName}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">Event Venue</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Address details */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <VenueDetail
            icon={<Navigation className="h-3.5 w-3.5" />}
            label="Address"
            value={event.addressLine}
          />
          <VenueDetail
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="City"
            value={`${event.city}, ${event.postcode}`}
          />
          <VenueDetail
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Country"
            value={event.country}
          />
          <VenueDetail
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Postcode"
            value={event.postcode}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-purple-500/20 to-blue-500/20 py-2.5 text-sm font-medium text-purple-300 transition hover:from-purple-500/30 hover:to-blue-500/30 hover:text-white"
          >
            <MapPin className="h-4 w-4" />
            View on Map
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}

function VenueDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-zinc-900/30 px-3.5 py-2.5">
      <div className="mt-0.5 text-purple-400/70">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
        <p className="truncate text-sm text-zinc-300">{value}</p>
      </div>
    </div>
  );
}

/* ── Resale Listings Section ── */

function ResaleListingsSection({ eventId, eventName }: { eventId: string; eventName: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ResaleListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getResaleListings(eventId)
      .then((res) => {
        if (res.ok && res.data) setListings(res.data);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleBuyResale = async (listing: ResaleListingResponse) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }

    setBuyingId(listing.id);
    setBuyError(null);
    try {
      const client = createBrowserClient();
      const fee = listing.askingPrice * (BOOKING_FEE_PERCENT / 100);
      const res = await client.buyResaleTicket(listing.id, Math.round(fee * 100) / 100);
      if (res.ok && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setBuyError(res.message || "Failed to start checkout");
        setBuyingId(null);
      }
    } catch (err: unknown) {
      setBuyError(err instanceof Error ? err.message : "Checkout failed");
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-zinc-500" />
          <span className="text-sm text-zinc-500">Loading resale listings...</span>
        </div>
      </div>
    );
  }

  if (listings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-zinc-950/60 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <RefreshCw className="h-5 w-5 text-amber-400" />
        Resale Tickets
        <span className="ml-auto rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
          {listings.length} available
        </span>
      </h2>

      {buyError && (
        <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {buyError}
        </div>
      )}

      <div className="space-y-3">
        {listings.map((listing) => {
          const fee = listing.askingPrice * (BOOKING_FEE_PERCENT / 100);
          const total = listing.askingPrice + fee;

          return (
            <div
              key={listing.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-sm font-medium text-white">
                    £{listing.askingPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-600">
                    + £{fee.toFixed(2)} fee
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Originally £{listing.originalPurchasePrice.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => handleBuyResale(listing)}
                disabled={buyingId === listing.id}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
              >
                {buyingId === listing.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Buy £${total.toFixed(2)}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">
        Resale tickets are capped at the current ticket price. Seller gets their original purchase price back.
      </p>
    </div>
  );
}

/* ── Info Chip ── */

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-purple-400">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="text-sm font-medium text-zinc-200">{value}</p>
      </div>
    </div>
  );
}
