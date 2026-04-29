"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createPublicClient, createBrowserClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
  EventResponse,
  TicketBatch,
  ResaleListingResponse,
} from "@/lib/shared";
import { BOOKING_FEE_PERCENT, RESALE_FEE_PERCENT } from "@/lib/shared";
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
  ChevronDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export default function EventDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) {
      setCalendarConnected(false);
      return;
    }

    const client = createBrowserClient();
    client
      .getGoogleCalendarStatus()
      .then((res) => {
        if (res.ok && res.data) {
          setCalendarConnected(Boolean(res.data.connected));
        }
      })
      .catch(() => {
        setCalendarConnected(false);
      });
  }, [user]);

  useEffect(() => {
    const status = searchParams.get("calendar");
    const message = searchParams.get("calendar_message");

    if (!status) return;

    if (status === "connected") {
      setCalendarToast(
        "Google Calendar connected. Tap again to add this event.",
      );
      setCalendarConnected(true);
    } else if (status === "failed") {
      setCalendarToast(message || "Google Calendar connection failed.");
    }

    window.setTimeout(() => setCalendarToast(null), 3500);
    router.replace(`/events/${eventId}`);
  }, [searchParams, router, eventId]);

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

  const handleAddToCalendar = () => {
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`,
      );
      return;
    }

    setCalendarBusy(true);
    const client = createBrowserClient();

    const addEvent = async () => {
      const addRes = await client.addGoogleCalendarEvent({
        eventName: event.eventName,
        eventDescription: event.eventDescription,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venueName: event.venueName,
        city: event.city,
        mapsLink: event.mapsLink,
      });

      if (addRes.ok) {
        setCalendarToast("Event added to your Google Calendar.");
      } else {
        const msg = addRes.message || "Failed to add event to calendar.";
        const needsReconnect =
          /authorization expired|reconnect google calendar/i.test(msg);

        if (needsReconnect) {
          setCalendarConnected(false);
          const connectRes = await client.getGoogleCalendarConnectUrl(
            `/events/${event.id}`,
          );
          if (connectRes.ok && connectRes.data?.url) {
            setCalendarToast("Reconnecting Google Calendar...");
            window.location.href = connectRes.data.url;
            return;
          }
        }

        setCalendarToast(msg);
      }
      window.setTimeout(() => setCalendarToast(null), 3500);
      setCalendarBusy(false);
    };

    if (calendarConnected) {
      addEvent().catch((err: unknown) => {
        setCalendarToast(
          err instanceof Error
            ? err.message
            : "Failed to add event to calendar.",
        );
        window.setTimeout(() => setCalendarToast(null), 3500);
        setCalendarBusy(false);
      });
      return;
    }

    client
      .getGoogleCalendarConnectUrl(`/events/${event.id}`)
      .then((res) => {
        if (res.ok && res.data?.url) {
          window.location.href = res.data.url;
          return;
        }
        setCalendarToast(
          res.message || "Failed to start Google Calendar connect.",
        );
        window.setTimeout(() => setCalendarToast(null), 3500);
        setCalendarBusy(false);
      })
      .catch((err: unknown) => {
        setCalendarToast(
          err instanceof Error
            ? err.message
            : "Failed to start Google Calendar connect.",
        );
        window.setTimeout(() => setCalendarToast(null), 3500);
        setCalendarBusy(false);
      });
  };

  return (
    <div className="min-h-screen bg-black text-cream/90">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-cream/40">
          <Link href="/events" className="transition hover:text-gold">
            Events
          </Link>
          <span>/</span>
          <span className="text-muted">{event.eventName}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            {/* Hero — badges bottom-left on image only */}
            <div className="relative mb-6 overflow-hidden rounded-xl">
              <div className="relative aspect-video w-full">
                <Image
                  src={imageUrl}
                  alt={event.eventName}
                  fill
                  priority
                  className="object-cover"
                  unoptimized
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="rounded-md bg-black/60 px-3 py-1 text-xs font-medium text-cream backdrop-blur-sm">
                    {event.eventCategory}
                  </span>
                </div>
              </div>
            </div>

            <h1 className="mb-3 font-serif text-3xl font-bold text-cream sm:text-4xl">
              {event.eventName}
            </h1>

            <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span>
                  {new Date(event.eventDate).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span>
                  {event.startTime} – {event.endTime}
                </span>
              </div>
              <a
                href={
                  event.mapsLink ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.city}`)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 transition-colors hover:text-gold"
              >
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="truncate">
                  {event.venueName}, {event.city}
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </a>
            </div>

            <button
              type="button"
              onClick={handleAddToCalendar}
              disabled={calendarBusy}
              className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-cream/40 transition-colors hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {calendarBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarDays className="h-3.5 w-3.5" />
              )}
              {calendarConnected
                ? "Add to Google Calendar"
                : "Connect Google Calendar"}
            </button>

            <div className="space-y-8">
              <div className="flex flex-col items-start gap-2">
                <p
                  className={`whitespace-pre-wrap text-muted leading-relaxed mb-8 ${!isExpanded ? "line-clamp-4" : ""}`}
                >
                  {event.eventDescription}
                </p>
                {event.eventDescription &&
                  event.eventDescription.length > 200 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-gold text-xs font-semibold uppercase tracking-wider hover:underline cursor-pointer"
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <TicketPurchasePanel event={event} />
          </div>
        </div>
      </div>

      {calendarToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-lg backdrop-blur-sm">
          {calendarToast}
        </div>
      )}
    </div>
  );
}

/* ── Ticket Purchase Panel ── */

function TicketPurchasePanel({ event }: { event: EventResponse }) {
  const { user } = useAuth();
  const router = useRouter();
  const pickFirstPurchasableBatch = useCallback(
    (resaleMap?: Map<string, number>) => {
      const batches = event.ticketBatches ?? [];
      const firstAvailable = batches.find((batch) => {
        const primaryRemaining = batch.remaining ?? batch.quantity;
        const resaleAvailable =
          resaleMap?.get(batch.name) ?? batch.resaleAvailable ?? 0;
        const totalAvailable =
          batch.totalAvailableForPurchase ?? primaryRemaining + resaleAvailable;
        return totalAvailable > 0;
      });
      return firstAvailable ?? batches[0];
    },
    [event.ticketBatches],
  );

  const [eventResaleListings, setEventResaleListings] = useState<
    ResaleListingResponse[]
  >([]);
  const [selectedBatch, setSelectedBatch] = useState<TicketBatch>(
    () => pickFirstPurchasableBatch() ?? event.ticketBatches[0],
  );
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const client = createPublicClient();
    client
      .getResaleListings(event.id)
      .then((res) => {
        if (!cancelled && res.ok && res.data) {
          setEventResaleListings(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setEventResaleListings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  const purchasableResaleByBatch = useMemo(() => {
    const map = new Map<string, number>();
    for (const listing of eventResaleListings) {
      if (user?.id && listing.sellerId === user.id) continue;
      const batchKey =
        listing.targetTicketBatchName ||
        listing.originalTicketBatchName ||
        listing.ticketBatchName ||
        "";
      if (!batchKey) continue;
      map.set(batchKey, (map.get(batchKey) ?? 0) + 1);
    }
    return map;
  }, [eventResaleListings, user?.id]);

  useEffect(() => {
    const currentPrimaryRemaining =
      selectedBatch.remaining ?? selectedBatch.quantity;
    const currentResaleAvailable =
      purchasableResaleByBatch.get(selectedBatch.name) ??
      selectedBatch.resaleAvailable ??
      0;
    const currentTotalAvailable =
      selectedBatch.totalAvailableForPurchase ??
      currentPrimaryRemaining + currentResaleAvailable;

    if (currentTotalAvailable > 0) return;

    const fallback = pickFirstPurchasableBatch(purchasableResaleByBatch);
    if (fallback && fallback.name !== selectedBatch.name) {
      setSelectedBatch(fallback);
      setQuantity(1);
    }
  }, [selectedBatch, purchasableResaleByBatch, pickFirstPurchasableBatch]);

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

  const selectedBatchTotalAvailable =
    selectedBatch.totalAvailableForPurchase ??
    (selectedBatch.remaining ?? selectedBatch.quantity) +
      (purchasableResaleByBatch.get(selectedBatch.name) ??
        selectedBatch.resaleAvailable ??
        0);

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

  const formatEntryCutoff = (value?: string | null) => {
    if (!value) return null;

    const cutoff = new Date(value);
    if (Number.isNaN(cutoff.getTime())) return null;

    return cutoff.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="sticky top-20">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-1 font-serif text-xl font-semibold text-cream">
          Get Tickets
        </h3>
        <p className="mb-5 text-xs text-cream/40">
          Ticket price + booking fee. Buy early, pay less.
        </p>

        {/* <div className="mb-5 rounded-xl border border-border bg-[#222222]/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Booking Fee
            </span>
            <span className="rounded-full bg-[#222222] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-muted">
              High
            </span>
          </div>
          <div className="mb-3 text-3xl font-bold text-muted">
            {BOOKING_FEE_PERCENT.toFixed(1)}%
          </div>
          <div className="mb-4 flex gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-sm ${
                  i < feeSegments ? "bg-muted" : "bg-border"
                }`}
              />
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-cream/40">
              <span>Final week</span>
              <span className="tabular-nums">+5.0%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-cream/40">
              <span>Selling fast · {Math.max(0, 100 - soldPct)}% left</span>
              <span className="tabular-nums">+1.0%</span>
            </div>
            <div className="mt-0.5 border-t border-border pt-1.5 flex items-center justify-between text-xs text-cream/40">
              <span>Min. platform fee</span>
              <span className="tabular-nums">7%</span>
            </div>
          </div>
        </div> */}

        <div className="space-y-3 ">
          {event.ticketBatches.map((batch) => {
            const batchPrimaryRemaining = batch.remaining ?? batch.quantity;
            const batchResaleAvailable =
              purchasableResaleByBatch.get(batch.name) ??
              batch.resaleAvailable ??
              0;
            const batchTotalAvailable =
              batch.totalAvailableForPurchase ??
              batchPrimaryRemaining + batchResaleAvailable;
            const soldOut = batchTotalAvailable <= 0;
            const primarySoldOut = batchPrimaryRemaining <= 0;
            const cutoffDate = batch.entryWindowCutoff
              ? new Date(batch.entryWindowCutoff)
              : null;
            const hasValidCutoff =
              cutoffDate && !Number.isNaN(cutoffDate.getTime());
            const entryClosed =
              hasValidCutoff && Date.now() > cutoffDate.getTime();
            const batchFee =
              Math.round(batch.basePrice * (BOOKING_FEE_PERCENT / 100) * 100) /
              100;
            const isSelected = selectedBatch.name === batch.name;
            return (
              <div
                key={batch.name}
                role="button"
                tabIndex={soldOut ? -1 : 0}
                onClick={() => {
                  if (!soldOut) {
                    setSelectedBatch(batch);
                    if (quantity > batchTotalAvailable) {
                      setQuantity(Math.max(1, batchTotalAvailable));
                    }
                  }
                }}
                onKeyDown={(event) => {
                  if (soldOut) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedBatch(batch);
                    if (quantity > batchTotalAvailable) {
                      setQuantity(Math.max(1, batchTotalAvailable));
                    }
                  }
                }}
                className={`rounded-xl border p-4 transition-colors ${
                  soldOut
                    ? "border-border bg-[#222222]/40 opacity-50"
                    : isSelected
                      ? "cursor-pointer border-gold/30 bg-[#222222]/60"
                      : "cursor-pointer border-border hover:border-gold/30"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-cream">
                    {batch.name}
                  </span>
                  <span className="text-xs text-cream/40">
                    {soldOut ?? "Sold out"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs text-cream/40">
                      £{batch.basePrice.toFixed(2)} + £{batchFee.toFixed(2)} fee
                    </p>
                    {hasValidCutoff ? (
                      <p
                        className={`mt-1 text-[11px] ${
                          entryClosed ? "text-rose-300/90" : "text-cream/50"
                        }`}
                      >
                        {entryClosed ? "Entry closed at " : "Entry cutoff: "}
                        {formatEntryCutoff(batch.entryWindowCutoff)}
                      </p>
                    ) : null}
                    {!soldOut && batchResaleAvailable > 0 ? (
                      <p className="mt-1 text-[11px] text-gold/70">
                        Includes {batchResaleAvailable} resale on The List
                      </p>
                    ) : null}
                    {!soldOut && primarySoldOut ? (
                      <p className="mt-1 text-[11px] text-cream/50">
                        Primary sold out. Checkout fulfills resale first.
                      </p>
                    ) : null}
                  </div>

                  {!soldOut && isSelected ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleBuyNow();
                      }}
                      disabled={buying || selectedBatchTotalAvailable <= 0}
                      className="rounded-lg bg-gold px-4 py-1.5 text-xs font-semibold text-void transition-colors hover:bg-gold-light disabled:opacity-50"
                    >
                      {buying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Buy"
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-[#222222]/60 px-4 py-3">
          <span className="text-sm text-cream/60">Quantity</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={selectedBatchTotalAvailable <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-cream transition hover:bg-border disabled:opacity-50"
            >
              -
            </button>
            <span className="w-6 text-center font-semibold text-cream">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) => Math.min(selectedBatchTotalAvailable, q + 1))
              }
              disabled={selectedBatchTotalAvailable <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-cream transition hover:bg-border disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-xl border border-border bg-[#222222]/60 p-4 text-sm">
          <div className="flex justify-between text-cream/50">
            <span>
              {selectedBatch.name} × {quantity}
            </span>
            <span className="font-mono text-cream/80">
              £{baseTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-cream/50">
            <span>Booking fee × {quantity}</span>
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
          disabled={buying || selectedBatchTotalAvailable <= 0}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-sm font-semibold text-void transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-xs text-cream/50">
            <Lock className="h-3.5 w-3.5 shrink-0 text-gold/70" />
            Sign in when prompted after tapping Buy on a release.
          </div>
        )}

        {/* <p className="mt-4 text-center text-[10px] leading-relaxed text-cream/40">
          The Smart Timing Fee reflects time and demand — your ticket price
          stays fair. Secure checkout via Stripe.
        </p> */}
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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-surface">
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
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-cream/50 transition hover:border-white/15 hover:text-cream"
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
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/4 py-2.5 text-sm font-medium text-cream/80 transition hover:border-white/15 hover:text-cream"
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
    <div className="flex items-start gap-2.5 border-b border-white/6 py-2.5 last:border-0 sm:border-0 sm:py-2">
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

function formatBatchCutoff(cutoff?: string | null) {
  if (!cutoff) return null;
  const date = new Date(cutoff);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resaleAccessLabel(
  listing: ResaleListingResponse,
  event: EventResponse,
) {
  const originalBatchName =
    listing.originalTicketBatchName ||
    listing.ticketBatchName ||
    "General Admission";
  const targetBatchName = listing.targetTicketBatchName || originalBatchName;
  const originalPrice = Number(
    Number.isFinite(listing.originalPurchasePrice)
      ? listing.originalPurchasePrice
      : listing.askingPrice,
  );

  if (listing.reallocationType === "same_batch") {
    return {
      title: `${originalBatchName} access`,
      detail: `Final access: ${originalBatchName} · £${originalPrice.toFixed(2)}`,
    };
  }

  const targetBatch = event.ticketBatches.find(
    (batch) => batch.name === targetBatchName,
  );
  const cutoffText = formatBatchCutoff(targetBatch?.entryWindowCutoff);
  return {
    title: `${targetBatchName} access`,
    detail: cutoffText
      ? `Final access: ${targetBatchName} · £${listing.askingPrice.toFixed(2)} · Entry cutoff ${cutoffText}`
      : `Final access: ${targetBatchName} · £${listing.askingPrice.toFixed(2)}`,
  };
}

function ResaleListingsSection({ event }: { event: EventResponse }) {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<ResaleListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingIds, setBuyingIds] = useState<string[]>([]);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [showListInfo, setShowListInfo] = useState(false);
  const listInfoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getResaleListings(event.id)
      .then((res) => {
        if (res.ok && res.data) setListings(res.data);
      })
      .finally(() => setLoading(false));
  }, [event.id]);

  useEffect(() => {
    if (!showListInfo) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!listInfoRef.current) return;
      const target = event.target as Node;
      if (!listInfoRef.current.contains(target)) {
        setShowListInfo(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [showListInfo]);

  const visibleListings = useMemo(
    () =>
      user?.id
        ? listings.filter((listing) => listing.sellerId !== user.id)
        : listings,
    [listings, user?.id],
  );

  const handleBuyResale = async (selectedListings: ResaleListingResponse[]) => {
    const firstListing = selectedListings[0];
    if (!firstListing) return;

    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`,
      );
      return;
    }

    const selectedListingIds = selectedListings.map((listing) => listing.id);
    setBuyingIds(selectedListingIds);
    setBuyError(null);
    try {
      const client = createBrowserClient();
      const fee = firstListing.askingPrice * (RESALE_FEE_PERCENT / 100);
      const res = await client.buyResaleTicket(
        firstListing.id,
        Math.round(fee * 100) / 100,
        selectedListingIds,
      );
      if (res.ok && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setBuyError(res.message || "Failed to start checkout");
        setBuyingIds([]);
      }
    } catch (err: unknown) {
      setBuyError(err instanceof Error ? err.message : "Checkout failed");
      setBuyingIds([]);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface p-6">
        <div className="flex items-center gap-2 text-sm text-cream/45">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading The List
        </div>
      </div>
    );
  }

  if (visibleListings.length === 0) return null;

  return (
    <section>
      <div
        ref={listInfoRef}
        className="group relative mb-5 inline-flex items-center"
      >
        <h2 className="flex items-center gap-3 font-serif text-2xl font-extrabold text-gold">
          The List
        </h2>
        <button
          type="button"
          onClick={() => setShowListInfo((v) => !v)}
          aria-label="About The List"
          aria-expanded={showListInfo}
          aria-controls="the-list-info"
          className="ml-2 flex h-4 w-4 items-center justify-center rounded-full border border-white text-[10px] text-white transition hover:bg-white/10 hover:text-white"
        >
          !
        </button>
        <div
          id="the-list-info"
          className={`absolute bottom-full left-0 z-50 mb-2 w-70 rounded-xl border border-white/10 bg-surface p-3.5 text-xs leading-relaxed text-cream/80 shadow-2xl transition-all ${
            showListInfo
              ? "pointer-events-auto -translate-y-1 opacity-100"
              : "pointer-events-none opacity-0 md:group-hover:pointer-events-auto md:group-hover:-translate-y-1 md:group-hover:opacity-100"
          }`}
        >
          Same ticket. Same price. A student can't attend — their spot is now
          yours, instantly and securely.
        </div>
      </div>

      {buyError && (
        <div className="mb-4 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {buyError}
        </div>
      )}

      <div className="space-y-3">
        {Array.from(
          visibleListings
            .reduce((map, listing) => {
              const key = [
                listing.reallocationType,
                listing.originalTicketBatchName ||
                  listing.ticketBatchName ||
                  "General Admission",
                listing.targetTicketBatchName ||
                  listing.originalTicketBatchName ||
                  listing.ticketBatchName ||
                  "General Admission",
                listing.askingPrice,
              ].join("|");
              if (!map.has(key)) map.set(key, []);
              map.get(key)!.push(listing);
              return map;
            }, new Map<string, ResaleListingResponse[]>())
            .values(),
        ).map((groupStr) => (
          <ResaleGroupAccordion
            key={groupStr[0].id}
            group={groupStr}
            event={event}
            buyingIds={buyingIds}
            onBuy={handleBuyResale}
          />
        ))}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-cream/40">
        Resale is capped at the current release price. Sellers are refunded
        their original purchase amount after sale.
      </p>
    </section>
  );
}

function ResaleGroupAccordion({
  group,
  event,
  buyingIds,
  onBuy,
}: {
  group: ResaleListingResponse[];
  event: EventResponse;
  buyingIds: string[];
  onBuy: (listings: ResaleListingResponse[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const representative = group[0];
  const fee =
    Math.round(representative.askingPrice * (RESALE_FEE_PERCENT / 100) * 100) /
    100;
  const accessLabel = resaleAccessLabel(representative, event);
  const maxQuantity = Math.max(1, group.length);
  const quantity = Math.min(selectedQuantity, maxQuantity);
  const selectedListings = group.slice(0, quantity);
  const isProcessing =
    buyingIds.length > 0 &&
    selectedListings.some((listing) => buyingIds.includes(listing.id));

  return (
    <div className="rounded-xl border border-white/10 bg-[#1c1c1c]/90 px-3 py-4 backdrop-blur-md transition-colors hover:border-white/15 sm:px-4">
      <div
        className="flex cursor-pointer flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="max-w-full wrap-break-word font-semibold text-sm leading-tight text-cream sm:truncate">
              {accessLabel.title}
            </p>
            <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-cream/65">
              Verified seller
            </span>
          </div>
          <p className="text-xs text-cream/70">{accessLabel.detail}</p>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-3 sm:text-right">
          <div className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-1.5 text-right transition-colors hover:bg-gold/15 sm:px-4 sm:py-2">
            <p className="text-xs font-semibold text-gold whitespace-nowrap">
              £{representative.askingPrice.toFixed(2)}
              <span className="ml-1 text-[11px] font-medium text-gold/70 sm:text-sm">
                + £{fee.toFixed(2)} listing fee
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gold/40 text-[10px] font-bold text-gold">
              x{group.length}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-cream/50 transition-transform ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-white/10 pt-4">
          {/* <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-cream/40">
              Individual Tickets
            </p> */}

          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-gold/25 bg-gold/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="text-xs font-medium text-cream/75">
              Buy quantity ({maxQuantity} available)
            </span>
            <div className="flex w-full min-w-0 items-center gap-1.5 sm:ml-auto sm:w-auto sm:gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuantity((q) => Math.max(1, q - 1));
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-black/30 text-sm text-cream transition hover:bg-white/10 sm:h-7 sm:w-7"
              >
                -
              </button>
              <span className="w-5 shrink-0 text-center text-sm font-semibold text-gold sm:w-7">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuantity((q) => Math.min(maxQuantity, q + 1));
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-black/30 text-sm text-cream transition hover:bg-white/10 sm:h-7 sm:w-7"
              >
                +
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedListings.length > 0) onBuy(selectedListings);
                }}
                disabled={!selectedListings.length || isProcessing}
                className="ml-auto rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold whitespace-nowrap transition hover:bg-gold/20 disabled:opacity-50 sm:px-3 sm:text-xs"
              >
                {isProcessing ? (
                  <>
                    <span className="sm:hidden">...</span>
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  `Buy ${quantity} ${quantity === 1 ? "ticket" : "tickets"}`
                )}
              </button>
            </div>
          </div>
          {/* <div className="space-y-2">
            {selectedListings.map((listing, idx) => (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/8 p-3 hover:bg-white/12 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cream">
                    Ticket #{idx + 1}
                  </p>
                  <p className="truncate text-xs font-mono text-cream/40">
                    ID: {listing.id.slice(-8)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBuy(listing);
                  }}
                  disabled={buyingId === listing.id}
                  className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/20 disabled:opacity-50"
                >
                  {buyingId === listing.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Buy"
                  )}
                </button>
              </div>
            ))}
          </div> */}
        </div>
      )}
    </div>
  );
}
