"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { createPublicClient } from "@/lib/api";
import type { EventResponse } from "@/lib/shared";
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

  const weekDates = useMemo(
    () => getWeekDates(calendarAnchor),
    [calendarAnchor],
  );
  const monthYear = calendarAnchor.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const categories = useMemo(
    () => ["all", ...new Set(events.map((e) => e.eventCategory))],
    [events],
  );

  const filtered = events.filter((e) => {
    if (selectedCategory !== "all" && e.eventCategory !== selectedCategory)
      return false;
    if (selectedDate) {
      const d = new Date(e.eventDate);
      if (d.toDateString() !== selectedDate.toDateString()) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !e.eventName.toLowerCase().includes(q) &&
        !e.venueName.toLowerCase().includes(q) &&
        !e.eventDescription.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-cream/90">
      <Header />

      <div className="relative">
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <EventsHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories.filter((c) => c !== "all")}
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
                <p className="text-lg font-semibold text-cream">
                  No events found
                </p>
                <p className="mt-1 text-sm text-cream/60">
                  Try a different search or category.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-5 mb-5 text-sm text-cream/50">
                {filtered.length} events found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((event) => (
                  <ExploreEventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
        <Footer />
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
    <header className="space-y-8 pt-4">
      <div>
        <h1 className="font-serif text-4xl tracking-tight text-cream sm:text-5xl md:text-6xl font-extrabold">
          Events
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/55 sm:text-[15px]">
          Find your next night out. No scalping — resale always at the current
          release price.
        </p>
      </div>

      {/* Date strip — bordered panel */}
      <div className="rounded-xl border border-border bg-[#1A1A1A] px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-4 ">
          <button
            type="button"
            onClick={prevWeek}
            aria-label="Previous week"
            className="shrink-0 rounded-lg p-2 text-cream/50 transition hover:bg-white/6 hover:text-cream"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="flex-1 text-center text-sm font-medium text-cream sm:text-base">
            {monthYear}
          </span>
          <button
            type="button"
            onClick={nextWeek}
            aria-label="Next week"
            className="shrink-0 rounded-lg p-2 text-cream/50 transition hover:bg-white/6 hover:text-cream"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex justify-between gap-1.5 overflow-x-auto pb-1 sm:gap-2">
          {weekDates.map((d) => {
            const dateStr = d.toDateString();
            const isSelected = selectedDate?.toDateString() === dateStr;
            const hasEvents = eventDates.includes(dateStr);
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : d)}
                className={`flex min-w-36 flex-col items-center rounded-lg py-2.5 text-sm transition sm:px-3 ${isSelected
                  ? "bg-gold/10 text-gold hover:bg-gold/20"
                  : "text-cream/90 hover:bg-white/5"
                  }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${isSelected ? "text-gold/90" : "text-cream/45"
                    }`}
                >
                  {d.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span className="mt-0.5 text-[15px] font-semibold tabular-nums">
                  {d.getDate()}
                </span>
                <span className="mt-1 flex h-2 items-end justify-center">
                  {hasEvents ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-gold" : "bg-gold/80"
                        }`}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + category pills — single row on large screens */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events or venues..."
            className="w-full rounded-xl border py-3 pr-4 pl-10 text-sm text-cream outline-none transition placeholder:text-cream/35 focus:border-gold/70 focus:ring-1 focus:ring-gold/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:max-w-[52%] lg:justify-end xl:max-w-none">
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition ${selectedCategory === "all"
              ? "bg-gold text-black"
              : "border border-white/8 bg-surface text-cream/90 hover:border-white/15"
              }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold capitalize tracking-wide transition ${selectedCategory === cat
                ? "bg-gold text-black"
                : "border border-white/8 bg-surface text-cream/90 hover:border-white/15"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

