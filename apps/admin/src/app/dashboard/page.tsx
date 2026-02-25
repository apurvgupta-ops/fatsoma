"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventResponse } from "@fatsoma/shared";
import Link from "next/link";

export default function DashboardPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const client = createApiClient(token);
    client.getEvents().then((res) => {
      if (res.ok && res.data) setEvents(res.data);
    }).finally(() => setLoading(false));
  }, [token]);

  const published = events.filter((e) => e.status === "published").length;
  const drafts = events.filter((e) => e.status === "draft").length;
  const totalRevenue = events.reduce(
    (s, e) => s + e.ticketBatches.reduce((t, b) => t + b.quantity * b.basePrice, 0), 0
  );

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header>
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
            <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
            Organizer Admin Panel
          </div>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Overview of your events and platform metrics.
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Events" value={events.length.toString()} accent="purple" />
              <StatCard label="Published" value={published.toString()} accent="emerald" />
              <StatCard label="Drafts" value={drafts.toString()} accent="amber" />
              <StatCard label="Gross Revenue" value={`£${totalRevenue.toLocaleString()}`} accent="blue" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Events</h2>
                <Link href="/events" className="text-sm text-purple-300 hover:text-purple-200 transition">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/60 px-5 py-4 transition hover:border-white/20">
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${event.status === "published" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      <div>
                        <p className="text-sm font-semibold text-white">{event.eventName}</p>
                        <p className="text-xs text-zinc-500">{event.venueName} · {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-zinc-900/60 px-2 py-0.5 text-xs text-zinc-400">{event.eventCategory}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-300",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-300",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300",
  };
  const c = colors[accent] || colors.purple;
  return (
    <div className={`rounded-2xl border bg-linear-to-br p-5 ${c}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
    </div>
  );
}
