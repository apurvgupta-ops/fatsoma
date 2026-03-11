"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventResponse } from "@fatsoma/shared";
import Link from "next/link";
import Image from "next/image";

export default function EventsPage() {
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

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
              <span className="h-px w-10 bg-linear-to-r from-gold to-gold-light" />
              Event Management
            </div>
            <h1 className="text-3xl font-semibold text-cream sm:text-4xl">Your Events</h1>
            <p className="mt-2 max-w-2xl text-sm text-cream/60">Manage all your events in one place.</p>
          </div>
          <Link href="/events/create"
            className="rounded-xl bg-linear-to-r from-gold via-gold/80 to-gold-light px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-gold/30 transition hover:brightness-110">
            + Create New Event
          </Link>
        </header>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center rounded-3xl border border-border bg-void/60 p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-cream">No events yet</h3>
              <p className="mt-2 text-sm text-cream/60">Get started by creating your first event.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const totalTickets = event.ticketBatches.reduce((s, b) => s + b.quantity, 0);
              const minPrice = Math.min(...event.ticketBatches.map((b) => b.basePrice));
              const isPlaceholder = event.eventImage.startsWith("placeholder-");
              const imageUrl = isPlaceholder
                ? `https://placehold.co/400x300/1a1a1a/9333ea.png?text=${encodeURIComponent(event.eventName)}`
                : event.eventImage.startsWith("/uploads/")
                  ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016"}${event.eventImage}`
                  : event.eventImage;

              return (
                <Link key={event.id} href={`/events/${event.id}/edit`} className="group overflow-hidden rounded-3xl border border-border bg-void/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:border-border hover:bg-void/80">
                  <div className="relative aspect-video overflow-hidden bg-surface">
                    <Image src={imageUrl} alt={event.eventName} fill loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
                    <div className="absolute inset-0 bg-linear-to-t from-void via-void/40 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm ${event.status === "published" ? "bg-gold/20 text-gold border border-gold/40" : "bg-gold-light/15 text-gold-light border border-gold-light/30"}`}>
                        {event.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-cream group-hover:text-gold transition">{event.eventName}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-cream/60">{event.eventDescription}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm text-cream/90">
                      <div className="space-y-1">
                        <p>{event.venueName} · {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p>{totalTickets} tickets · From £{minPrice.toFixed(2)}</p>
                      </div>
                      <span className="rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold opacity-0 transition group-hover:opacity-100">
                        Edit
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
