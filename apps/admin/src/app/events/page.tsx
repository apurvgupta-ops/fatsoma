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
            <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
              <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
              Event Management
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Your Events</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">Manage all your events in one place.</p>
          </div>
          <Link href="/events/create"
            className="rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110">
            + Create New Event
          </Link>
        </header>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/60 p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">No events yet</h3>
              <p className="mt-2 text-sm text-zinc-400">Get started by creating your first event.</p>
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
                  ? `${process.env.NEXT_PUBLIC_API_URL || "https://onthelistapp.24livehost.com:3016"}${event.eventImage}`
                  : event.eventImage;

              return (
                <Link key={event.id} href={`/events/${event.id}/edit`} className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:border-white/20 hover:bg-zinc-950/80">
                  <div className="relative aspect-video overflow-hidden bg-zinc-900">
                    <Image src={imageUrl} alt={event.eventName} fill loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium backdrop-blur-sm ${event.status === "published" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"}`}>
                        {event.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition">{event.eventName}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{event.eventDescription}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-zinc-300">
                      <div className="space-y-1">
                        <p>{event.venueName} · {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p>{totalTickets} tickets · From £{minPrice.toFixed(2)}</p>
                      </div>
                      <span className="rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 opacity-0 transition group-hover:opacity-100">
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
