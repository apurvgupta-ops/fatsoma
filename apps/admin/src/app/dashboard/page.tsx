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
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
            <span className="h-px w-10 bg-linear-to-r from-gold to-gold-light" />
            Organizer Admin Panel
          </div>
          <h1 className="text-3xl font-semibold text-cream sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-cream/60">
            Overview of your events and platform metrics.
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Events" value={events.length.toString()} accent="purple" href="/events" />
              <StatCard label="Published" value={published.toString()} accent="emerald" href="/events" />
              <StatCard label="Drafts" value={drafts.toString()} accent="amber" href="/events" />
              <StatCard label="Gross Revenue" value={`£${totalRevenue.toLocaleString()}`} accent="blue" href="/payments" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-cream">Recent Events</h2>
                <Link href="/events" className="text-sm text-gold hover:text-gold transition">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <Link key={event.id} href={`/events/${event.id}/edit`} className="flex items-center justify-between rounded-2xl border border-border bg-void/60 px-5 py-4 transition hover:border-gold/30 hover:bg-void/80">
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${event.status === "published" ? "bg-gold" : "bg-gold-light/60"}`} />
                      <div>
                        <p className="text-sm font-semibold text-cream">{event.eventName}</p>
                        <p className="text-xs text-cream/60">{event.venueName} · {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-border bg-surface/60 px-2 py-0.5 text-xs text-cream/60">{event.eventCategory}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function StatCard({ label, value, accent, href }: { label: string; value: string; accent: string; href?: string }) {
  const colors: Record<string, string> = {
    purple: "from-gold/20 to-gold/5 border-gold/30 text-gold",
    blue: "from-gold-light/20 to-gold-light/5 border-gold-light/30 text-gold-light",
    emerald: "from-gold/15 to-gold/5 border-gold/25 text-gold",
    amber: "from-gold-light/15 to-gold-light/5 border-gold-light/25 text-gold-light",
  };
  const c = colors[accent] || colors.purple;
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-cream/60">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`block rounded-2xl border bg-linear-to-br p-5 transition hover:brightness-110 ${c}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`rounded-2xl border bg-linear-to-br p-5 ${c}`}>
      {content}
    </div>
  );
}
