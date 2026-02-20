"use client";

import Image from "next/image";
import Link from "next/link";

type EventCardProps = {
  event: {
    id: string;
    eventName: string;
    eventDescription: string;
    eventCategory: string;
    eventImage: string;
    venueName: string;
    eventDate: string;
    startTime: string;
    status: "draft" | "published";
    ticketBatches: {
      quantity: number;
      basePrice: number;
      minDiscount: number;
      maxDiscount: number;
    }[];
  };
};

export default function EventCard({ event }: EventCardProps) {
  const totalTicketsFromBatches = event.ticketBatches.reduce(
    (acc, batch) => acc + batch.quantity,
    0
  );

  const minRevenue = event.ticketBatches.reduce(
    (acc, batch) =>
      acc + batch.quantity * batch.basePrice * (1 - batch.maxDiscount / 100),
    0
  );

  const maxRevenue = event.ticketBatches.reduce(
    (acc, batch) =>
      acc + batch.quantity * batch.basePrice * (1 - batch.minDiscount / 100),
    0
  );

  // Calculate discount range for display
  const discounts = event.ticketBatches.map((batch) => ({
    min: batch.minDiscount,
    max: batch.maxDiscount,
  }));
  const maxDiscount = Math.max(...discounts.map((d) => d.max));
  const minBasePrice = Math.min(...event.ticketBatches.map((b) => b.basePrice));

  // Check if it's a local uploaded image
  const isLocalUpload = event.eventImage.startsWith("/uploads/") || event.eventImage.startsWith("/api/uploads/");
  
  // Check if it's a placeholder image
  const isPlaceholder = event.eventImage.startsWith("placeholder-");

  // Convert old-style URLs to new API route format
  const normalizedImageUrl = event.eventImage.startsWith("/uploads/")
    ? event.eventImage.replace("/uploads/", "/api/uploads/")
    : event.eventImage;

  // Determine image URL
  const imageUrl = isPlaceholder
    ? `https://placehold.co/400x300/1a1a1a/9333ea.png?text=${encodeURIComponent(
        event.eventName
      )}`
    : normalizedImageUrl;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:border-white/20 hover:bg-zinc-950/80"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        <Image
          src={imageUrl}
          alt={event.eventName}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized={isLocalUpload}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/400x300/1a1a1a/9333ea.png?text=${encodeURIComponent(
              event.eventName
            )}`;
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm ${
              event.status === "published"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}
          >
            {event.status === "published" ? "Published" : "Draft"}
          </span>
          <span className="rounded-full border border-white/20 bg-zinc-900/70 backdrop-blur-sm px-2 py-1 text-xs text-zinc-300">
            {event.eventCategory}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition">
          {event.eventName}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
          {event.eventDescription}
        </p>

        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <svg
              className="h-4 w-4 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{event.venueName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <svg
              className="h-4 w-4 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {new Date(event.eventDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              · {event.startTime}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <svg
              className="h-4 w-4 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <span>
              {totalTicketsFromBatches} tickets · From £
              {minBasePrice.toFixed(2)}
              {maxDiscount > 0 && (
                <span className="ml-1 text-emerald-400">
                  (up to {maxDiscount}% off)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <svg
              className="h-3.5 w-3.5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Revenue: £{minRevenue.toLocaleString()} - £
              {maxRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute right-4 bottom-4 opacity-0 transition group-hover:opacity-100">
        <svg
          className="h-5 w-5 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
