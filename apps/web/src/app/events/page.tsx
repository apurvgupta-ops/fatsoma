"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { createPublicClient } from "@/lib/api";
import type { EventResponse } from "@fatsoma/shared";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExploreEventCard from "@/components/ExploreEventCard";

function getWeekDates(anchor: Date) {
  const start = new Date(anchor);
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getPublishedEvents()
      .then((res) => {
        if (res.ok && res.data) setEvents(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const weekDates = useMemo(() => getWeekDates(calendarAnchor), [calendarAnchor]);
  const monthYear = calendarAnchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const categories = useMemo(() => ["all", ...new Set(events.map((e) => e.eventCategory))], [events]);

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
    if (selectedDate) {
      const d = new Date(e.eventDate);
      if (d.toDateString() !== selectedDate.toDateString()) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-cream/90">
      <Header />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[140px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
          <EventsHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories.filter((c) => c !== "all")}
            filteredCount={filtered.length}
            calendarAnchor={calendarAnchor}
            setCalendarAnchor={setCalendarAnchor}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            weekDates={weekDates}
            monthYear={monthYear}
            eventDates={events.map((e) => new Date(e.eventDate).toDateString())}
          />

          {loading ? (
            <div className="flex min-h-60 items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-border/50 bg-void/60 py-20">
              <div className="text-center">
                <p className="text-lg font-semibold text-cream">No events found</p>
                <p className="mt-1 text-sm text-cream/60">Try a different search or category.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 py-12 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((event) => (
                <ExploreEventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          <Footer />
        </div>
      </div>
    </div>
  );
}

function EventsHeader({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  filteredCount,
  calendarAnchor,
  setCalendarAnchor,
  selectedDate,
  setSelectedDate,
  weekDates,
  monthYear,
  eventDates,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  categories: string[];
  filteredCount: number;
  calendarAnchor: Date;
  setCalendarAnchor: (d: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  weekDates: Date[];
  monthYear: string;
  eventDates: string[];
}) {
  const prevWeek = () => {
    const d = new Date(calendarAnchor);
    d.setDate(d.getDate() - 7);
    setCalendarAnchor(d);
  };
  const nextWeek = () => {
    const d = new Date(calendarAnchor);
    d.setDate(d.getDate() + 7);
    setCalendarAnchor(d);
  };

  return (
    <header className="space-y-8 pt-8">
      {/* Title */}
      <div>
        <h1 className="text-4xl font-bold text-cream sm:text-5xl">Events</h1>
        <p className="mt-2 text-sm text-cream/60">
          Find your next night out. No scalping — resale always at the current release price.
        </p>
      </div>

      {/* Date selector */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prevWeek}
            className="rounded-lg p-1.5 text-cream/60 transition hover:bg-white/5 hover:text-cream"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[140px] text-center font-medium text-cream">
            {monthYear}
          </span>
          <button
            type="button"
            onClick={nextWeek}
            className="rounded-lg p-1.5 text-cream/60 transition hover:bg-white/5 hover:text-cream"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDates.map((d) => {
            const dateStr = d.toDateString();
            const isSelected = selectedDate?.toDateString() === dateStr;
            const hasEvents = eventDates.includes(dateStr);
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : d)}
                className={`flex min-w-[72px] flex-col items-center rounded-xl border px-3 py-2.5 text-sm transition ${
                  isSelected
                    ? "border-gold bg-surface/80 text-gold"
                    : "border-border bg-surface/40 text-cream/90 hover:border-gold/50"
                }`}
              >
                <span className="text-[10px] uppercase text-cream/60">
                  {d.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span className="mt-1 font-semibold">{d.getDate()}</span>
                {hasEvents && (
                  <span
                    className={`mt-1.5 h-1 w-1 rounded-full ${
                      isSelected ? "bg-gold" : "bg-gold/70"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Category pills */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events or venues..."
            className="w-full rounded-xl border border-border bg-surface/60 py-3 pr-4 pl-10 text-sm text-cream/90 outline-none transition placeholder:text-cream/40 focus:border-gold focus:ring-0"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange("all")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              selectedCategory === "all"
                ? "bg-gold text-void"
                : "bg-surface/60 text-cream/90 hover:bg-surface"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-cream/60">{filteredCount} events found</p>
    </header>
  );
}
