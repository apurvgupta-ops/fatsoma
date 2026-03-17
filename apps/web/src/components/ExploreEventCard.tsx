"use client";

import { MapPin, CalendarDays, Ticket, Percent } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { EventResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export default function ExploreEventCard({ event }: { event: EventResponse }) {
  const minPrice = Math.min(...event.ticketBatches.map((b) => b.basePrice));
  const feeAmount = Math.round(minPrice * (BOOKING_FEE_PERCENT / 100) * 100) / 100;
  const isPlaceholder = event.eventImage.startsWith("placeholder-");
  const imageUrl = isPlaceholder
    ? `https://placehold.co/400x300/1a1a1a/9333ea.png?text=${encodeURIComponent(event.eventName)}`
    : event.eventImage.startsWith("/uploads/")
      ? `${API_URL}${event.eventImage}`
      : event.eventImage;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative flex flex-col overflow-hidden bg-void/50 transition-all duration-700 hover:bg-void"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
        <Image
          src={imageUrl}
          alt={event.eventName}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        {/* Subtle border overlay on image */}
        <div className="pointer-events-none absolute inset-0 border border-border/30 z-10 transition-colors duration-700 group-hover:border-gold/30" />

        <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/80 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-cream backdrop-blur-sm">
            {event.eventCategory}
          </span>
          {event.allowResale && (
            <span className="rounded-full bg-gold px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-void backdrop-blur-sm">
              Resale Available
            </span>
          )}
        </div>
        {event.ticketBatches.every((b) => (b.remaining ?? b.quantity) <= 0) && (
          <span className="absolute right-4 top-4 z-20 rounded px-2 py-0.5 bg-red-500/90 text-[10px] font-semibold uppercase text-white backdrop-blur-sm">
            Sold Out
          </span>
        )}
      </div>

      <div className="flex flex-col grow pt-5 pb-2 px-1">
        <h3 className="text-2xl font-serif font-light text-cream transition duration-500 group-hover:text-gold line-clamp-2">
          {event.eventName}
        </h3>

        <p className="mt-2 text-sm text-cream/60 truncate">
          {event.venueName}{event.city ? `, ${event.city}` : ""}
        </p>
        <p className="mt-0.5 text-sm text-cream/60">
          {new Date(event.eventDate).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>

        <div className="mt-auto pt-4 flex items-end justify-end">
          {event.ticketBatches.every((b) => (b.remaining ?? b.quantity) <= 0) ? (
            <span className="text-sm text-cream/60">Check resale</span>
          ) : (
            <span className="text-sm font-semibold text-cream">From £{minPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
