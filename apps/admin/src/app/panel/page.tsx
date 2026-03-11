"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventResponse } from "@fatsoma/shared";
import { BOOKING_FEE_PERCENT } from "@fatsoma/shared";
import { Activity, BarChart3, Ticket, DollarSign, Percent } from "lucide-react";

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
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
            <span className="h-px w-10 bg-linear-to-r from-gold to-gold-light" />
            Panel
          </div>
          <h1 className="text-3xl font-semibold text-cream sm:text-4xl">Fee Overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-cream/60">
            Platform-wide {BOOKING_FEE_PERCENT}% booking fee applied to all events.
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
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${filter === f
                  ? "bg-gold/20 text-gold border border-gold/40"
                  : "border border-border text-cream/60 hover:text-cream/90"
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Event Rows */}
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center rounded-3xl border border-border bg-void/60 p-12">
            <p className="text-cream/60">No events found.</p>
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

function PanelEventRow({ event }: { event: EventResponse }) {
  const totalTickets = event.ticketBatches.reduce((s, b) => s + b.quantity, 0);
  const grossRevenue = event.ticketBatches.reduce((s, b) => s + b.quantity * b.basePrice, 0);
  const feeRevenue = grossRevenue * (BOOKING_FEE_PERCENT / 100);
  const avgPrice = totalTickets > 0 ? grossRevenue / totalTickets : 0;

  return (
    <div className="group flex flex-col gap-4 rounded-3xl border border-border bg-void/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:border-border sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-cream">{event.eventName}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${event.status === "published"
                ? "bg-gold/20 text-gold border border-gold/40"
                : "bg-gold-light/15 text-gold-light border border-gold-light/30"
              }`}
          >
            {event.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-cream/60">
          {event.venueName} · {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-cream/60">Tickets</p>
          <p className="font-mono text-sm text-cream/90">{totalTickets.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-cream/60">Avg Price</p>
          <p className="font-mono text-sm text-cream/90">£{avgPrice.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-cream/60">Fee Rev</p>
          <p className="font-mono text-sm text-gold">£{feeRevenue.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-2">
          <Percent className="h-4 w-4 text-gold" />
          <span className="font-mono text-lg font-bold text-cream">{BOOKING_FEE_PERCENT}%</span>
        </div>
      </div>
    </div>
  );
}

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
    purple: "from-gold/20 to-gold/5 text-gold border-gold/20",
    blue: "from-gold-light/20 to-gold-light/5 text-gold-light border-gold-light/20",
    emerald: "from-gold/15 to-gold/5 text-gold border-gold/20",
    amber: "from-gold-light/15 to-gold-light/5 text-gold-light border-gold-light/20",
  };

  return (
    <div className={`rounded-2xl border bg-linear-to-br p-5 ${colors[accent]}`}>
      <div className="mb-3 flex items-center gap-2 text-current [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="text-2xl font-bold text-cream">{value}</p>
      <p className="mt-1 text-xs text-cream/60">{label}</p>
    </div>
  );
}
