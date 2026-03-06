"use client";

import { MapPin, CalendarDays, Ticket, Percent } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { EventResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-500 hover:border-purple-500/30 hover:bg-zinc-950/90"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
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
          <span className="rounded-full border border-white/20 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
            {event.eventCategory}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/70 px-2.5 py-1 text-xs font-semibold text-purple-300 backdrop-blur-md">
            <Percent className="h-3 w-3" />
            {BOOKING_FEE_PERCENT}% fee
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-white transition group-hover:text-purple-300">
          {event.eventName}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">
          {event.eventDescription}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-400" />
            <span className="truncate">{event.venueName}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-purple-400" />
            {new Date(event.eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-purple-400" />
            From £{minPrice.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3">
          <div className="text-sm text-zinc-400">
            <span className="text-white font-semibold">£{minPrice.toFixed(2)}</span> + £{feeAmount.toFixed(2)} fee
          </div>
          <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300">
            {BOOKING_FEE_PERCENT}% booking fee
          </span>
        </div>
      </div>
    </Link>
  );
}
