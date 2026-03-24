"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black">
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
    <div className="min-h-screen bg-black text-cream/90">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <nav className="mb-5 text-xs text-cream/45 sm:text-sm">
          <Link href="/events" className="transition hover:text-gold">
            Events
          </Link>
          <span className="mx-2 text-cream/30">/</span>
          <span className="text-cream/65">{event.eventName}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_min(380px,100%)] lg:items-start lg:gap-12">
          <div className="min-w-0">
            {/* Hero — badges bottom-left on image only */}
            <div className="relative mb-8 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
              <div className="relative aspect-[16/10] w-full sm:aspect-[2/1]">
                <Image
                  src={imageUrl}
                  alt={event.eventName}
                  fill
                  priority
                  className="object-cover"
                  unoptimized
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 sm:bottom-5 sm:left-5">
                  <span className="rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream backdrop-blur-sm">
                    {event.eventCategory}
                  </span>
                  {event.allowResale && (
                    <span className="rounded-md bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
                      Resale Enabled
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h1 className="mb-6 max-w-4xl font-serif text-3xl font-light leading-[1.15] tracking-tight text-cream sm:text-4xl md:text-5xl">
              {event.eventName}
            </h1>

            {/* Meta row — icon + value, single line each */}
            <div className="mb-10 flex flex-wrap gap-x-10 gap-y-3 border-b border-white/10 pb-8">
              <div className="flex items-center gap-2.5 text-sm text-cream/75">
                <CalendarDays
                  className="h-4 w-4 shrink-0 text-cream/40"
                  strokeWidth={1.5}
                />
                <span>
                  {new Date(event.eventDate).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-cream/75">
                <Clock
                  className="h-4 w-4 shrink-0 text-cream/40"
                  strokeWidth={1.5}
                />
                <span>
                  {event.startTime} – {event.endTime}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2.5 text-sm text-cream/75">
                <MapPin
                  className="h-4 w-4 shrink-0 text-cream/40"
                  strokeWidth={1.5}
                />
                <span className="truncate">
                  {event.venueName}, {event.city}
                </span>
              </div>
            </div>

            <div className="space-y-10">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream/50">
                {event.eventDescription}
              </p>

              {event.allowResale && <ResaleListingsSection event={event} />}
            </div>
          </div>

          <div className="min-w-0">
            <TicketPurchasePanel event={event} />
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

  const feeSegments = Math.min(
    6,
    Math.max(2, Math.round(2 + (soldPct / 100) * 3)),
  );

  return (
    <div className="lg:sticky lg:top-24">
      <div className="rounded-xl border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:p-7">
        <h3 className="font-serif text-2xl font-light tracking-tight text-cream">
          Get Tickets
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-cream/45">
          Ticket price + Smart Timing Fee. Buy early, pay less.
        </p>

        <div className="mt-6 rounded-lg border border-white/8 bg-black/45 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/40">
              Smart timing fee
            </p>
            <span className="shrink-0 rounded border border-gold/35 bg-gold/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
              Coming Soon
            </span>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-gold">
            {BOOKING_FEE_PERCENT.toFixed(1)}%
          </p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-sm ${
                  i < feeSegments ? "bg-gold" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-cream/50">
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Percent className="h-3.5 w-3.5 shrink-0 text-cream/35" />
                Standard pricing
              </span>
              <span className="shrink-0 text-cream/40">+1.0%</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Ticket className="h-3.5 w-3.5 shrink-0 text-cream/35" />
                Selling fast: {Math.max(0, 100 - soldPct)}% left
              </span>
              <span className="shrink-0 text-cream/40">+1.0%</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 shrink-0 text-cream/35" />
                Min. platform fee
              </span>
              <span className="shrink-0 text-cream/40">3.0%</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-4 text-center align-baseline">
          {event.ticketBatches.map((batch) => {
            const batchRemaining = batch.remaining ?? batch.quantity;
            const soldOut = batchRemaining <= 0;
            const batchFee =
              Math.round(batch.basePrice * (BOOKING_FEE_PERCENT / 100) * 100) /
              100;
            const isSelected = selectedBatch.name === batch.name;
            return (
              <div
                key={batch.name}
                className={`rounded-lg border p-5 transition cursor-pointer ${
                  soldOut
                    ? "border-white/6 bg-white/2 opacity-55"
                    : isSelected
                      ? "border-gold/45 bg-gold/6"
                      : "border-white/8 bbg-white/3 hover:border-white/12"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (!soldOut) {
                        setSelectedBatch(batch);
                        if (quantity > batchRemaining)
                          setQuantity(Math.max(1, batchRemaining));
                      }
                    }}
                    disabled={soldOut}
                    className={`min-w-0 flex-1 text-left ${
                      soldOut ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <p className="text-sm font-medium text-cream">
                      {batch.name}
                    </p>
                    <p className="mt-0.5 text-xs text-cream/45">
                      {soldOut
                        ? "Sold out"
                        : `${batchRemaining.toLocaleString()} left`}
                    </p>
                    <p className="mt-1 text-xs text-cream/55">
                      £{batch.basePrice.toFixed(2)} + £{batchFee.toFixed(2)} fee
                    </p>
                  </button>
                  {/* {!soldOut && isSelected && (
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={
                        buying ||
                        (selectedBatch.remaining ?? selectedBatch.quantity) <= 0
                      }
                      className="shrink-0 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {buying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : !user ? (
                        "Buy"
                      ) : (
                        "Buy"
                      )}
                    </button>
                  )} */}
                  <div>
                    <label className="mb-[5px] block text-[10px] font-semibold uppercase tracking-wider text-cream/40">
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={
                          (selectedBatch.remaining ?? selectedBatch.quantity) <=
                          0
                        }
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cream transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono text-base font-semibold text-cream">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            Math.min(
                              Math.min(
                                10,
                                selectedBatch.remaining ??
                                  selectedBatch.quantity,
                              ),
                              q + 1,
                            ),
                          )
                        }
                        disabled={
                          (selectedBatch.remaining ?? selectedBatch.quantity) <=
                          0
                        }
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cream transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 space-y-2 rounded-lg border border-white/8 bg-black/30 p-4 text-sm">
          <div className="flex justify-between text-cream/50">
            <span>
              {selectedBatch.name} × {quantity}
            </span>
            <span className="font-mono text-cream/80">
              £{baseTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-cream/50">
            <span>Smart timing fee × {quantity}</span>
            <span className="font-mono text-cream/80">
              £{feeTotal.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-white/10 pt-2">
            <div className="flex justify-between font-medium text-cream">
              <span>Total</span>
              <span className="font-mono text-base text-gold">
                £{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={
            buying || (selectedBatch.remaining ?? selectedBatch.quantity) <= 0
          }
          className="mt-5 w-full rounded-lg bg-gold py-3.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {buying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Ticket className="h-4 w-4" />
              {user
                ? `Buy Now · £${grandTotal.toFixed(2)}`
                : `Continue · £${grandTotal.toFixed(2)}`}
            </>
          )}
        </button>

        {buyError && (
          <div className="mt-4 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {buyError}
          </div>
        )}

        {!user && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-cream/50">
            <Lock className="h-3.5 w-3.5 shrink-0 text-gold/70" />
            Sign in when prompted after tapping Buy on a release.
          </div>
        )}

        <p className="mt-4 text-center text-[10px] leading-relaxed text-cream/40">
          The Smart Timing Fee reflects time and demand — your ticket price
          stays fair. Secure checkout via Stripe.
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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
      <div className="relative h-32 overflow-hidden bg-surface/80">
        <div className="absolute inset-0 bg-linear-to-br from-gold/10 via-transparent to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-black/50 backdrop-blur-sm">
            <MapPin className="h-5 w-5 text-gold" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-serif text-xl font-light text-cream">
              <Building2 className="h-4 w-4 shrink-0 text-gold/70" />
              {event.venueName}
            </h2>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-cream/35">
              Venue
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-cream/50 transition hover:border-white/15 hover:text-cream"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mb-5 grid gap-1 sm:grid-cols-2">
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/10 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/15"
          >
            <MapPin className="h-4 w-4" strokeWidth={1.5} />
            View on Map
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-cream/80 transition hover:border-white/15 hover:text-cream"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            Directions
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
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 border-b border-white/[0.06] py-2.5 last:border-0 sm:border-0 sm:py-2">
      <div className="mt-0.5 text-cream/35">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-cream/35">
          {label}
        </p>
        <p className="truncate text-sm text-cream/75">{value}</p>
      </div>
    </div>
  );
}

/* ── Resale Listings Section ── */

function resaleTierLabel(
  listing: ResaleListingResponse,
  event: EventResponse,
): string {
  const match = event.ticketBatches.find(
    (b) => Math.abs(b.basePrice - listing.askingPrice) < 0.005,
  );
  return match?.name ?? "Resale listing";
}

function currentReleasePrice(event: EventResponse): {
  price: number;
  fee: number;
} {
  const available = event.ticketBatches.filter(
    (b) => (b.remaining ?? b.quantity) > 0,
  );
  const batches = available.length ? available : event.ticketBatches;
  const price = Math.min(...batches.map((b) => b.basePrice));
  const fee = Math.round(price * (BOOKING_FEE_PERCENT / 100) * 100) / 100;
  return { price, fee };
}

function ResaleListingsSection({ event }: { event: EventResponse }) {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ResaleListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  const { price: releasePrice, fee: releaseFee } = currentReleasePrice(event);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getResaleListings(event.id)
      .then((res) => {
        if (res.ok && res.data) setListings(res.data);
      })
      .finally(() => setLoading(false));
  }, [event.id]);

  const handleBuyResale = async (listing: ResaleListingResponse) => {
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`,
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
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
        <div className="flex items-center gap-2 text-sm text-cream/45">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading resale listings…
        </div>
      </div>
    );
  }

  if (listings.length === 0) return null;

  return (
    <section>
      <h2 className="mb-5 font-serif text-2xl font-extrabold  ">
        Resale Listings
      </h2>

      {buyError && (
        <div className="mb-4 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {buyError}
        </div>
      )}

      <div className="space-y-3">
        {listings.map((listing) => {
          const fee =
            Math.round(
              listing.askingPrice * (BOOKING_FEE_PERCENT / 100) * 100,
            ) / 100;
          const tier = resaleTierLabel(listing, event);

          return (
            <div
              key={listing.id}
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1a1a1a] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-cream">
                  {tier}
                  <span className="rounded border border-white/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-cream/45 ml-2">
                    Verified seller
                  </span>
                </p>
                <p className="mt-2 text-xs text-cream/45">
                  Current release: £{releasePrice.toFixed(2)} + £
                  {releaseFee.toFixed(2)} transfer fee
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleBuyResale(listing)}
                disabled={buyingId === listing.id}
                className="flex w-full shrink-0 flex-col items-center justify-center rounded-lg border border-gold/70 bg-transparent text-center transition hover:bg-gold/10 disabled:opacity-60 sm:w-auto sm:min-w-auto sm:max-w-auto cursor-pointer"
              >
                {buyingId === listing.id ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gold" />
                ) : (
                  <button className="bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-colors rounded-lg px-5 py-2 text-right whitespace-nowrap cursor-pointer">
                    <span className="text-gold font-semibold text-sm">
                      £{listing.askingPrice.toFixed(2)}
                    </span>
                    <span className="text-text-dim text-xs ml-1.5">
                      + £{fee.toFixed(2)} fee
                    </span>
                  </button>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-cream/40">
        Resale is capped at the current release price. Sellers are refunded
        their original purchase amount after sale.
      </p>
    </section>
  );
}
