"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TrendingUp, TrendingDown, Minus, MapPin, CalendarDays, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { EventResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";

interface TickerPoint {
  value: number;
  timestamp: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ExploreEventCard({ event }: { event: EventResponse }) {
  const seed = useCallback(() => {
    let h = 0;
    for (let i = 0; i < event.id.length; i++) {
      h = (Math.imul(31, h) + event.id.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }, [event.id]);

  const initialValue = (seed() % 50) / 10;

  const [history, setHistory] = useState<TickerPoint[]>([
    { value: initialValue, timestamp: Date.now() },
  ]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1].value;
        const delta = (Math.random() - 0.48) * 0.6;
        const next = Math.min(5, Math.max(0, +(last + delta).toFixed(2)));
        const updated = [...prev, { value: next, timestamp: Date.now() }];
        return updated.length > 40 ? updated.slice(-40) : updated;
      });
    }, 2500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const current = history[history.length - 1].value;
  const previous = history.length > 1 ? history[history.length - 2].value : current;
  const change = +(current - previous).toFixed(2);
  const trend: "up" | "down" | "flat" = change > 0 ? "up" : change < 0 ? "down" : "flat";

  const trendColor = { up: "text-emerald-400", down: "text-rose-400", flat: "text-zinc-400" }[trend];
  const trendBg = { up: "border-emerald-500/40 shadow-emerald-500/10", down: "border-rose-500/40 shadow-rose-500/10", flat: "border-zinc-500/30 shadow-zinc-500/5" }[trend];
  const sparkColor = { up: "#34d399", down: "#fb7185", flat: "#a1a1aa" }[trend];
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const sparkWidth = 200;
  const sparkHeight = 48;
  const points = history.map((p, i) => {
    const x = (i / Math.max(history.length - 1, 1)) * sparkWidth;
    const y = sparkHeight - (p.value / 5) * sparkHeight;
    return `${x},${y}`;
  });
  const polyline = points.join(" ");

  const minPrice = Math.min(...event.ticketBatches.map((b) => b.basePrice));
  const isPlaceholder = event.eventImage.startsWith("placeholder-");
  const imageUrl = isPlaceholder
    ? `https://placehold.co/400x300/1a1a1a/9333ea.png?text=${encodeURIComponent(event.eventName)}`
    : event.eventImage.startsWith("/uploads/")
      ? `${API_URL}${event.eventImage}`
      : event.eventImage;

  return (
    <Link href={`/events/${event.id}`} className={`group relative overflow-hidden rounded-3xl border bg-zinc-950/70 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-500 hover:bg-zinc-950/90 ${trendBg}`}>
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        <Image src={imageUrl} alt={event.eventName} fill loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-white/20 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">{event.eventCategory}</span>
        </div>
        <div className="absolute right-4 top-4">
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur-md transition-colors duration-500 ${trend === "up" ? "border-emerald-500/50 bg-emerald-950/70 text-emerald-300" : trend === "down" ? "border-rose-500/50 bg-rose-950/70 text-rose-300" : "border-zinc-500/50 bg-zinc-900/70 text-zinc-300"}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span className="font-mono text-sm font-bold tabular-nums">{current.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-white transition group-hover:text-purple-300">{event.eventName}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">{event.eventDescription}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-400" />
            <span className="truncate">{event.venueName}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-purple-400" />
            {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-purple-400" />
            From £{minPrice.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-zinc-900/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Booking Fee Trend</span>
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              <span>{change > 0 ? "+" : ""}{change.toFixed(2)}</span>
            </div>
          </div>
          <svg width="100%" height={sparkHeight} viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} preserveAspectRatio="none" className="overflow-visible">
            <defs>
              <linearGradient id={`web-grad-${event.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {history.length > 1 && (
              <>
                <polygon points={`0,${sparkHeight} ${polyline} ${sparkWidth},${sparkHeight}`} fill={`url(#web-grad-${event.id})`} />
                <polyline points={polyline} fill="none" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            <circle cx={((history.length - 1) / Math.max(history.length - 1, 1)) * sparkWidth} cy={sparkHeight - (current / 5) * sparkHeight} r="3.5" fill={sparkColor} className="animate-pulse" />
          </svg>
          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
            <span>0</span>
            <span className="font-mono text-zinc-500">{event.bookingFee ?? BOOKING_FEE_PERCENT}% booking fee</span>
            <span>5</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
