"use client";

import Image from "next/image";
import Link from "next/link";
import type { EventResponse } from "@/lib/shared";
import { formatEventDatesLabel } from "@/lib/formatEventDates";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export default function ExploreEventCard({ event }: { event: EventResponse }) {
  const minPrice = Math.min(...event.ticketBatches.map((b) => b.basePrice));
  const isPlaceholder = event.eventImage.startsWith("placeholder-");
  const imageUrl = isPlaceholder
    ? `https://placehold.co/400x300/1a1a1a/c9a84c.png?text=${encodeURIComponent(event.eventName)}`
    : event.eventImage.startsWith("/uploads/")
      ? `${API_URL}${event.eventImage}`
      : event.eventImage;

  const soldOut = event.ticketBatches.every(
    (b) => (b.remaining ?? b.quantity) <= 0,
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block h-full no-underline"
    >
      <div className="event-card flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="relative h-[220px] shrink-0 overflow-hidden bg-surface">
          <Image
            src={imageUrl}
            alt={event.eventName}
            fill
            loading="lazy"
            className="card-image object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/10 to-black/65" />
          <div className="absolute top-3 left-3 rounded-md border border-white/12 bg-black/75 px-2.5 py-1 font-jost text-[11px] text-cream uppercase">
            {event.eventCategory}
          </div>
          {soldOut && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-jost text-[13px] tracking-[0.1em] text-[#888888] uppercase">
              SOLD OUT
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="font-jost m-0 text-[11px] tracking-[0.1em] text-gold uppercase">
            {formatEventDatesLabel(event.eventDate, event.eventEndDate)}
          </p>
          <h3 className="mt-1 mb-0.5 text-xl leading-tight font-bold text-cream">
            {event.eventName}
          </h3>
          <p className="m-0 text-sm text-[#888888]">
            {event.venueName}
            {event.city ? `, ${event.city}` : ""}
          </p>

          <div className="my-4 border-t border-border" />

          <div className="mt-auto flex items-center justify-between">
            <div>
              {soldOut ? (
                <p className="m-0 text-[22px] text-[#555555]">—</p>
              ) : (
                <>
                  <p className="font-jost m-0 mb-0.5 text-[10px] text-[#888888] uppercase">
                    FROM
                  </p>
                  <p className="m-0 text-[22px] leading-none font-bold text-cream">
                    £{minPrice.toFixed(2)}
                  </p>
                </>
              )}
            </div>
            <div
              className={`rounded-md border px-5 py-2.5 text-sm ${
                soldOut
                  ? "border-[#222222] text-[#555555]"
                  : "border-border text-cream"
              }`}
            >
              {soldOut ? "Sold Out" : "Get Tickets"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
