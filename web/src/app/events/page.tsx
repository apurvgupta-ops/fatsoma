"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
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
  const [sortBy, setSortBy] = useState("date");
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

  const filtered = useMemo(() => {
    const base = events.filter((e) => {
      if (selectedCategory !== "all" && e.eventCategory !== selectedCategory) {
        return false;
      }

      if (selectedDate) {
        const d = new Date(e.eventDate);
        if (d.toDateString() !== selectedDate.toDateString()) {
          return false;
        }
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

    const minTicketPrice = (event: EventResponse) =>
      Math.min(...event.ticketBatches.map((b) => b.basePrice));

    const totalAvailability = (event: EventResponse) =>
      event.ticketBatches.reduce(
        (sum, batch) => sum + (batch.remaining ?? 0),
        0,
      );

    const sorted = [...base];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => minTicketPrice(a) - minTicketPrice(b));
    } else if (sortBy === "availability") {
      sorted.sort((a, b) => totalAvailability(b) - totalAvailability(a));
    } else {
      sorted.sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      );
    }

    return sorted;
  }, [events, selectedCategory, selectedDate, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-void text-cream/90">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        <div className="relative">
          <EventsHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
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
              <p className="mb-6 text-sm text-cream/40">
                {filtered.length} events found
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => (
                  <ExploreEventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function EventsHeader({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
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
  sortBy: string;
  onSortChange: (value: string) => void;
  categories: string[];
  calendarAnchor: Date;
  setCalendarAnchor: (d: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  weekDates: Date[];
  monthYear: string;
  eventDates: string[];
}) {
  const todayDateStr = new Date().toDateString();
  const rangeLabel = `${weekDates[0].toLocaleDateString("en-GB", { month: "short" })} - ${weekDates[6].toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
  const eventCountByDay = eventDates.reduce<Record<string, number>>(
    (acc, d) => {
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    },
    {},
  );

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
    <header>
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2 text-cream">
          Events
        </h1>
        <p className="text-muted">
          Find your next night out. No scalping — listed tickets always at the
          current release price.
        </p>
      </div>

      <div className="relative mb-8 flex items-start gap-4 rounded-xl border border-gold/20 bg-surface px-5 py-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10">
          <ShieldCheck className="h-4 w-4 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-muted">
            <span className="font-semibold text-cream">
              On The List has two ways to get in
            </span>{" "}
            - buy direct from the organiser, or claim a spot passed on by
            another student. Same price. Fully secure.
          </p>
        </div>
        <button
          type="button"
          className="mt-0.5 shrink-0 text-cream/40 transition-colors hover:text-cream"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={prevWeek}
            aria-label="Previous week"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#222222] text-muted transition-colors hover:bg-border hover:text-cream"
          >
            <ChevronLeft className="h-3.75 w-3.75" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-cream">{rangeLabel}</p>
          </div>
          <button
            type="button"
            onClick={nextWeek}
            aria-label="Next week"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#222222] text-muted transition-colors hover:bg-border hover:text-cream"
          >
            <ChevronRight className="h-3.75 w-3.75" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((d) => {
            const dateStr = d.toDateString();
            const isSelected = selectedDate?.toDateString() === dateStr;
            const isToday = dateStr === todayDateStr;
            const showTodayHighlight = !selectedDate && isToday;
            const inCurrentMonth = d.getMonth() === calendarAnchor.getMonth();
            const dayCount = eventCountByDay[dateStr] ?? 0;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : d)}
                aria-pressed={isSelected}
                className={`relative flex select-none flex-col items-center rounded-xl px-1 py-3 transition-all ${
                  !inCurrentMonth
                    ? "opacity-30"
                    : isSelected
                      ? "border border-gold/40 bg-gold/10"
                      : showTodayHighlight
                        ? "border border-gold/30 bg-gold/5"
                        : ""
                }`}
              >
                <span
                  className={`mb-1.5 text-[11px] font-medium ${
                    isSelected || showTodayHighlight
                      ? "text-gold/70"
                      : "text-cream/40"
                  }`}
                >
                  {d.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span
                  className={`text-sm font-bold leading-none ${isSelected || showTodayHighlight ? "text-gold" : "text-cream"}`}
                >
                  {d.getDate()}
                </span>
                <span className="mt-1.5 h-4">
                  {dayCount > 0 ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold/20 px-1 text-[10px] font-bold text-gold">
                      {dayCount}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-cream/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events or venues..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-cream outline-none transition-colors placeholder:text-cream/40 focus:border-gold/50"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-muted outline-none transition-colors focus:border-gold/50"
        >
          <option value="date">Date (soonest)</option>
          <option value="price-asc">Price (lowest)</option>
          <option value="availability">Availability</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-gold text-void"
              : "border border-border bg-surface text-muted hover:border-gold/30 hover:text-cream"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
              selectedCategory === cat
                ? "bg-gold text-void"
                : "border border-border bg-surface text-muted hover:border-gold/30 hover:text-cream"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
}
