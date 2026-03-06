"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import { TrendingUp, TrendingDown, Activity, BarChart3, Ticket, DollarSign } from "lucide-react";

export default function PanelPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    if (!token) return;
    const client = createApiClient(token);
    client
      .getEvents()
      .then((res) => {
        if (res.ok && res.data) setEvents(res.data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.status === filter);
  }, [events, filter]);

  const stats = useMemo(() => {
    const totalTickets = events.reduce(
      (s, e) => s + e.ticketBatches.reduce((ss, b) => ss + b.quantity, 0),
      0,
    );
    const totalRevenue = events.reduce(
      (s, e) => s + e.ticketBatches.reduce((ss, b) => ss + b.quantity * b.basePrice, 0),
      0,
    );
    const totalFees = totalRevenue * (BOOKING_FEE_PERCENT / 100);
    return { totalTickets, totalRevenue, totalFees, total: events.length };
  }, [events]);

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header>
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
            <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
            Stock Panel
          </div>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Booking Fee Monitor</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Real-time stock-market style view of your events&apos; {BOOKING_FEE_PERCENT}% booking fee performance.
          </p>
        </header>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={<BarChart3 />} label="Total Events" value={String(stats.total)} accent="purple" />
          <SummaryCard icon={<Ticket />} label="Total Tickets" value={stats.totalTickets.toLocaleString()} accent="blue" />
          <SummaryCard icon={<DollarSign />} label="Gross Revenue" value={`£${stats.totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} accent="emerald" />
          <SummaryCard icon={<Activity />} label={`${BOOKING_FEE_PERCENT}% Fee Revenue`} value={`£${stats.totalFees.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} accent="amber" />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "border border-white/10 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Event Rows */}
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/60 p-12">
            <p className="text-zinc-400">No events found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((event) => (
              <PanelEventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

/* ── Panel Event Row with Stock Indicator ── */

function PanelEventRow({ event }: { event: EventResponse }) {
  const totalTickets = event.ticketBatches.reduce((s, b) => s + b.quantity, 0);
  const grossRevenue = event.ticketBatches.reduce((s, b) => s + b.quantity * b.basePrice, 0);
  const feeRevenue = grossRevenue * (BOOKING_FEE_PERCENT / 100);
  const avgPrice = totalTickets > 0 ? grossRevenue / totalTickets : 0;

  return (
    <div className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:border-white/20 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-white">{event.eventName}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              event.status === "published"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}
          >
            {event.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {event.venueName} · {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tickets</p>
          <p className="font-mono text-sm text-zinc-200">{totalTickets.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Avg Price</p>
          <p className="font-mono text-sm text-zinc-200">£{avgPrice.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Fee Rev</p>
          <p className="font-mono text-sm text-emerald-300">£{feeRevenue.toFixed(2)}</p>
        </div>
        <BookingFeeStock fee={event.bookingFee ?? BOOKING_FEE_PERCENT} />
      </div>
    </div>
  );
}

/* ── Stock-Style 0-5 Indicator ── */

function BookingFeeStock({ fee }: { fee: number }) {
  const [display, setDisplay] = useState(fee);
  const [history, setHistory] = useState<number[]>(() => {
    const h: number[] = [];
    for (let i = 0; i < 20; i++) {
      h.push(Math.max(0, Math.min(5, fee + (Math.random() - 0.5) * 1.5)));
    }
    return h;
  });

  useEffect(() => {
    const iv = setInterval(() => {
      setDisplay((prev) => {
        const delta = (Math.random() - 0.5) * 0.6;
        const next = Math.max(0, Math.min(5, prev + delta));
        setHistory((h) => [...h.slice(-19), next]);
        return next;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const change = display - fee;
  const isUp = change >= 0;
  const color = isUp ? "text-emerald-400" : "text-rose-400";
  const bgColor = isUp ? "bg-emerald-500" : "bg-rose-500";

  const sparkline = useMemo(() => {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const h = 32;
    const w = 80;
    const step = w / (history.length - 1);
    const points = history
      .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
      .join(" ");
    return { points, w, h };
  }, [history]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-2">
      <div className="flex flex-col items-end">
        <span className="font-mono text-lg font-bold text-white">{display.toFixed(2)}</span>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${color}`}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isUp ? "+" : ""}
          {change.toFixed(2)}
        </span>
      </div>
      <svg width={sparkline.w} height={sparkline.h} className="shrink-0">
        <defs>
          <linearGradient id={`grad-${isUp ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${sparkline.h} ${sparkline.points} ${sparkline.w},${sparkline.h}`}
          fill={`url(#grad-${isUp ? "up" : "down"})`}
        />
        <polyline
          points={sparkline.points}
          fill="none"
          stroke={isUp ? "#10b981" : "#f43f5e"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={sparkline.w}
          cy={sparkline.points.split(" ").pop()?.split(",")[1]}
          r="2.5"
          className={`${bgColor} animate-pulse`}
          fill={isUp ? "#10b981" : "#f43f5e"}
        />
      </svg>
    </div>
  );
}

/* ── Summary Card ── */

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "purple" | "blue" | "emerald" | "amber";
}) {
  const colors = {
    purple: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
  };

  return (
    <div className={`rounded-2xl border bg-linear-to-br p-5 ${colors[accent]}`}>
      <div className="mb-3 flex items-center gap-2 text-current [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{label}</p>
    </div>
  );
}
