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
      className="group relative overflow-hidden rounded-3xl border border-border bg-void/70 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-500 hover:border-gold/30 hover:bg-void/90"
    >
      <div className="relative aspect-video overflow-hidden bg-surface">
        <Image
          src={imageUrl}
          alt={event.eventName}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-border bg-surface/70 px-2.5 py-1 text-xs font-medium text-cream/90 backdrop-blur-sm">
            {event.eventCategory}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/70 px-2.5 py-1 text-xs font-semibold text-gold backdrop-blur-md">
            <Percent className="h-3 w-3" />
            {BOOKING_FEE_PERCENT}% fee
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-cream transition group-hover:text-gold">
          {event.eventName}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-cream/60">
          {event.eventDescription}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-cream/60">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{event.venueName}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-gold" />
            {new Date(event.eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-gold" />
            From £{minPrice.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface/40 px-4 py-3">
          <div className="text-sm text-cream/60">
            <span className="text-cream font-semibold">£{minPrice.toFixed(2)}</span> + £{feeAmount.toFixed(2)} fee
          </div>
          <span className="rounded-full bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
            {BOOKING_FEE_PERCENT}% booking fee
          </span>
        </div>
      </div>
    </Link>
  );
}
