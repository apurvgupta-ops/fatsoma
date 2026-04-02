"use client";

import Image from "next/image";
import Link from "next/link";
import type { EventResponse } from "@/lib/shared";
import { BOOKING_FEE_PERCENT } from "@/lib/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export default function ExploreEventCard({ event }: { event: EventResponse }) {
  const minPrice = Math.min(...event.ticketBatches.map((b) => b.basePrice));
  const isPlaceholder = event.eventImage.startsWith("placeholder-");
  const imageUrl = isPlaceholder
    ? `https://placehold.co/400x300/1a1a1a/9333ea.png?text=${encodeURIComponent(event.eventName)}`
    : event.eventImage.startsWith("/uploads/")
      ? `${API_URL}${event.eventImage}`
      : event.eventImage;

  const soldOut = event.ticketBatches.every(
    (b) => (b.remaining ?? b.quantity) <= 0,
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-gold/30"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-surface">
        <Image
          src={imageUrl}
          alt={event.eventName}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          unoptimized
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-surface/90 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <span className="rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm">
            {event.eventCategory}
          </span>
          {event.allowResale && (
            <span className="rounded-md bg-gold/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              <span className="text-cream">Spots available </span>
              <span className="text-gold">on the list</span>
            </span>
          )}
          {soldOut && (
            <span className="rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-[#e8a598] backdrop-blur-sm">
              Sold Out
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-cream transition-colors group-hover:text-gold line-clamp-2">
          {event.eventName}
        </h3>

        <p className="mt-1 text-sm text-muted truncate">
          {event.venueName}
          {event.city ? `, ${event.city}` : ""}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-cream/40">
            {new Date(event.eventDate).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {soldOut ? (
            <span className="text-sm font-semibold text-cream/40">
              Check resale
            </span>
          ) : (
            <span className="text-sm font-semibold text-gold">
              From £{minPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

