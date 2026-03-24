"use client";

import Image from "next/image";
import Link from "next/link";
import type { EventResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";

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
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#0c0c0c] transition-all duration-300 hover:border-gold/35 hover:shadow-[0_0_0_1px_rgba(201,169,110,0.12)]"
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
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/20" />

        <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
          <span className="inline-block rounded-md bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream backdrop-blur-sm">
            {event.eventCategory}
          </span>
        </div>

        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5 sm:right-4 sm:top-4">
          {event.allowResale && (
            <span className="rounded-md bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
              Resale Available
            </span>
          )}
          {soldOut && (
            <span className="rounded-md bg-black/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#e8a598] backdrop-blur-sm">
              Sold Out
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-4">
        <h3 className="font-serif text-lg leading-snug text-cream transition-colors duration-300 group-hover:text-gold sm:text-xl line-clamp-2 font-semibold">
          {event.eventName}
        </h3>

        <p className="mt-2 truncate text-sm text-cream/50">
          {event.venueName}
          {event.city ? `, ${event.city}` : ""}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-sm text-cream/50">
            {new Date(event.eventDate).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {soldOut ? (
            <span className="shrink-0 text-sm font-medium text-cream/50">
              Check resale
            </span>
          ) : (
            <span className="shrink-0 text-sm text-gold font-semibold ">
              From £{minPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
