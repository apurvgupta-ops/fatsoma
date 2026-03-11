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

        <div className="absolute left-4 top-4 z-20">
          <span className="bg-void/80 px-3 py-1 text-[9px] font-mono tracking-widest uppercase text-cream/80 border border-border/50 backdrop-blur-md">
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

      <div className="flex flex-col grow pt-5 pb-2 px-1">
        <h3 className="text-2xl font-serif font-light text-cream transition duration-500 group-hover:text-gold line-clamp-2">
          {event.eventName}
        </h3>

        <div className="mt-4 flex flex-col gap-2 font-mono text-[10px] uppercase tracking-wider text-cream/50">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-3 w-3 text-gold/60" />
            {new Date(event.eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-gold/60" />
            <span className="truncate">{event.venueName}</span>
          </span>
        </div>

        <div className="mt-auto pt-6 flex items-end justify-between border-t border-border/30 mt-6">
          <div className="font-mono flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest text-cream/40">Tickets from</span>
            <span className="text-sm text-cream">£{minPrice.toFixed(2)}</span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-gold text-right">
            +{BOOKING_FEE_PERCENT}% fee
          </span>
        </div>
      </div>
    </Link>
  );
}
