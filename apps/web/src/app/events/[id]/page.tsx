"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPublicClient, createBrowserClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
  EventResponse,
  TicketBatch,
  ResaleListingResponse,
} from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f0f0f]">
        <p className="text-lg text-cream/60">{error || "Event not found"}</p>
        <Link href="/events" className="text-sm text-gold hover:underline">
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
    <div className="min-h-screen bg-[#0f0f0f] text-cream/90">
      <Header />
      <div className="border-b border-amber-900/40" />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm text-cream/60">
            <Link href="/events" className="hover:text-gold">
              Events
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream/80">{event.eventName}</span>
          </nav>

          {/* Hero Image */}
          <div className="relative mb-12 aspect-[21/9] overflow-hidden rounded-sm border-[0.5px] border-border/50">
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
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-void/90 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/90 backdrop-blur-sm">
                  {event.eventCategory}
                </span>
                {event.allowResale && (
                  <span className="rounded-full bg-void/90 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/90 backdrop-blur-sm">
                    Resale Enabled
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-serif font-light text-cream sm:text-5xl lg:text-7xl">
                {event.eventName}
              </h1>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left — Details */}
            <div className="space-y-6 lg:col-span-2">
              {/* Info Row */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 rounded-sm border-[0.5px] border-border/50 bg-void/60 p-6">
                <InfoChip
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date"
                  value={new Date(event.eventDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
                <InfoChip
                  icon={<Clock className="h-4 w-4" />}
                  label="Time"
                  value={`${event.startTime} — ${event.endTime}`}
                />
                <InfoChip
                  icon={<MapPin className="h-4 w-4" />}
                  label="Venue"
                  value={`${event.venueName}, ${event.city}`}
                />
                <InfoChip
                  icon={<Ticket className="h-4 w-4" />}
                  label="Tickets"
                  value={`${event.totalTickets.toLocaleString()} available`}
                />
              </div>

              {/* Description */}
              <div className="rounded-sm border-[0.5px] border-border/50 bg-void/60 p-8">
                <h2 className="mb-6 font-serif text-2xl font-light text-cream/90 tracking-wide">
                  About This Event
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream/60">
                  {event.eventDescription}
                </p>
              </div>

              {/* Venue */}
              <VenueCard event={event} />

              {/* Resale Listings */}
              {event.allowResale && (
                <ResaleListingsSection
                  eventId={event.id}
                  eventName={event.eventName}
                />
              )}
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
  const [selectedBatch, setSelectedBatch] = useState<TicketBatch>(
    event.ticketBatches[0],
  );
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const feePerTicket =
    Math.round(selectedBatch.basePrice * (BOOKING_FEE_PERCENT / 100) * 100) /
    100;
  const baseTotal = selectedBatch.basePrice * quantity;
  const feeTotal = Math.round(feePerTicket * quantity * 100) / 100;
  const grandTotal = Math.round((baseTotal + feeTotal) * 100) / 100;

  const handleBuyNow = useCallback(async () => {
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`,
      );
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

  const totalTickets = event.ticketBatches.reduce(
    (s, b) => s + (b.remaining ?? b.quantity),
    0,
  );
  const soldPct =
    event.totalTickets > 0
      ? Math.round(
          ((event.totalTickets - totalTickets) / event.totalTickets) * 100,
        )
      : 0;

  return (
    <div className="sticky top-12 space-y-6">
      {/* Ticket Selection */}
      <div className="rounded-sm border-[0.5px] border-border/50 bg-void/70 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <h3 className="mb-2 font-serif text-xl font-semibold text-cream">
          Get Tickets
        </h3>
        <p className="mb-6 text-xs text-cream/60">
          Ticket price + Smart Timing Fee. Buy early, pay less.
        </p>

        {/* Smart Timing Fee */}
        <div className="mb-6 rounded-xl border border-border bg-surface/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gold">
              {BOOKING_FEE_PERCENT}.0%
            </span>
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
              Low
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${Math.min(100, 20 + soldPct * 0.5)}%` }}
            />
          </div>
          <div className="mt-3 space-y-2 text-xs text-cream/60">
            <div className="flex justify-between">
              <span>Standard pricing</span>
              <span>+1.0%</span>
            </div>
            <div className="flex justify-between">
              <span>Selling fast — {100 - soldPct}% left</span>
              <span>+1.0%</span>
            </div>
            <div className="flex justify-between">
              <span>Min. platform fee</span>
              <span>3.0%</span>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-cream/50">
            Buy early. Pay less. The Smart Timing Fee adjusts with time and
            demand — never the ticket price.
          </p>
        </div>

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
                    if (quantity > batchRemaining)
                      setQuantity(Math.max(1, batchRemaining));
                  }
                }}
                disabled={soldOut}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  soldOut
                    ? "cursor-not-allowed border-border bg-white/2 opacity-50"
                    : selectedBatch.name === batch.name
                      ? "border-gold/50 bg-gold/10"
                      : "border-border bg-white/5 hover:border-border"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-cream">{batch.name}</p>
                  <p className="text-xs text-cream/60">
                    {soldOut ? "Sold out" : `${batchRemaining} remaining`}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-cream/90">
                  £{batch.basePrice.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quantity */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-cream/60">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white/5 text-cream/90 transition hover:bg-white/10"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-lg font-bold text-cream">
              {quantity}
            </span>
            <button
              onClick={() =>
                setQuantity((q) =>
                  Math.min(
                    Math.min(
                      10,
                      selectedBatch.remaining ?? selectedBatch.quantity,
                    ),
                    q + 1,
                  ),
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white/5 text-cream/90 transition hover:bg-white/10"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="mb-5 space-y-2 rounded-xl border border-border bg-surface/40 p-4 text-sm">
          <div className="flex justify-between text-cream/60">
            <span>
              {selectedBatch.name} × {quantity}
            </span>
            <span className="font-mono">£{baseTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-cream/60">
            <span className="flex items-center gap-1">
              Booking fee
              <span className="inline-flex items-center gap-0.5 rounded bg-gold/20 px-1 py-0.5 text-[10px] font-semibold text-gold">
                <Percent className="h-2.5 w-2.5" />
                {BOOKING_FEE_PERCENT}%
              </span>
              × {quantity}
            </span>
            <span className="font-mono">£{feeTotal.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex justify-between font-semibold text-cream">
              <span>Total</span>
              <span className="font-mono text-lg">
                £{grandTotal.toFixed(2)}
              </span>
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
          disabled={
            buying || (selectedBatch.remaining ?? selectedBatch.quantity) <= 0
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-gold via-gold/80 to-gold-light py-3.5 text-sm font-bold text-cream shadow-lg shadow-gold/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {buying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to
              Stripe...
            </>
          ) : !user ? (
            <>
              <Lock className="h-4 w-4" /> Sign in to Buy — £
              {grandTotal.toFixed(2)}
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Buy Now — £
              {grandTotal.toFixed(2)}
            </>
          )}
        </button>

        <p className="mt-3 text-center text-[10px] text-cream/60">
          Secure checkout via Stripe · {BOOKING_FEE_PERCENT}% platform booking
          fee
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

  const mapsSearchUrl =
    event.mapsLink ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="overflow-hidden rounded-sm border-[0.5px] border-border/50 bg-void/60 mt-6">
      {/* Map-style header with gradient */}
      <div className="relative h-36 overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.15)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Animated pin */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute -inset-4 animate-ping rounded-full bg-gold/20" />
            <div className="absolute -inset-2 rounded-full bg-gold/10" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light shadow-lg shadow-gold/30">
              <MapPin className="h-5 w-5 text-cream" />
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
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-xl font-light tracking-wide text-cream">
              <Building2 className="h-4.5 w-4.5 text-gold/60" />
              {event.venueName}
            </h2>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-cream/40">
              Event Venue
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs text-cream/60 transition hover:bg-white/10 hover:text-cream"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
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
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-gold/20 to-gold-light/20 py-2.5 text-sm font-medium text-gold transition hover:from-gold/30 hover:to-gold-light/30 hover:text-cream"
          >
            <MapPin className="h-4 w-4" />
            View on Map
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white/5 py-2.5 text-sm font-medium text-cream/90 transition hover:bg-white/10 hover:text-cream"
          >
            <ExternalLink className="h-4 w-4" />
            Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}

function VenueDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-none border-b border-border/30 bg-transparent px-2 py-3">
      <div className="mt-0.5 text-gold/70">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-cream/60">
          {label}
        </p>
        <p className="truncate text-sm text-cream/90">{value}</p>
      </div>
    </div>
  );
}

/* ── Resale Listings Section ── */

function ResaleListingsSection({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
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
      router.push(
        `/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`,
      );
      return;
    }

    setBuyingId(listing.id);
    setBuyError(null);
    try {
      const client = createBrowserClient();
      const fee = listing.askingPrice * (BOOKING_FEE_PERCENT / 100);
      const res = await client.buyResaleTicket(
        listing.id,
        Math.round(fee * 100) / 100,
      );
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
      <div className="rounded-2xl border border-border bg-void/60 p-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-cream/60" />
          <span className="text-sm text-cream/60">
            Loading resale listings...
          </span>
        </div>
      </div>
    );
  }

  if (listings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-void/60 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-cream">
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
              className="flex items-center justify-between rounded-xl border border-border bg-white/5 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-cream/60" />
                  <span className="text-sm font-medium text-cream">
                    £{listing.askingPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-cream/60">
                    + £{fee.toFixed(2)} fee
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-cream/60">
                  Originally £{listing.originalPurchasePrice.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => handleBuyResale(listing)}
                disabled={buyingId === listing.id}
                className="rounded-xl bg-linear-to-r from-gold via-gold/80 to-gold-light py-3.5 text-sm font-bold text-cream shadow-lg shadow-gold/30 transition hover:brightness-110 disabled:opacity-60 px-4"
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

      <p className="mt-3 text-[10px] text-cream/60">
        Resale tickets are capped at the current ticket price. Seller gets their
        original purchase price back.
      </p>
    </div>
  );
}

/* ── Info Chip ── */

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-gold">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-cream/60">
          {label}
        </p>
        <p className="text-sm font-medium text-cream/90">{value}</p>
      </div>
    </div>
  );
}
