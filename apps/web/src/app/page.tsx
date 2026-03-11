"use client";

import { useEffect, useState } from "react";
import { createPublicClient } from "@/lib/api";
import type { EventResponse } from "@fatsoma/shared";
import ExploreHeader from "@/components/ExploreHeader";
import ExploreEventCard from "@/components/ExploreEventCard";

export default function ExplorePage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const client = createPublicClient();
    client.getPublishedEvents().then((res) => {
      if (res.ok && res.data) setEvents(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(events.map((e) => e.eventCategory))];

  const filtered = events.filter((e) => {
    if (selectedCategory !== "all" && e.eventCategory !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.eventName.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q) ||
        e.eventDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-cream/90">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[140px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <ExploreHeader
              totalEvents={events.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />

            {loading ? (
              <div className="flex min-h-60 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex min-h-60 items-center justify-center rounded-sm border border-border/50 bg-void/60">
                <div className="text-center">
                  <p className="text-lg font-semibold text-cream">No events found</p>
                  <p className="mt-1 text-sm text-cream/60">Try a different search or category.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((event) => (
                  <ExploreEventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            <footer className="border-t border-border/50 pt-8 text-center text-xs text-cream/60">
              <p>Booking fee: <span className="text-cream/60">5%</span> · Trends update live · Powered by <span className="text-gold">OnTheList</span></p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
