"use client";

import { useEffect, useState, useMemo } from "react";
import { createPublicClient } from "@/lib/api";
import type { EventResponse } from "@/lib/shared";
import Header, { SITE_HEADER_OFFSET } from "@/components/Header";
import Footer from "@/components/Footer";
import ExploreEventCard from "@/components/ExploreEventCard";
import {
  isCalendarDayInEventRange,
  isEventStartDateTodayOrFuture,
} from "@/lib/formatEventDates";

const DAY_ABBR = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getWeekDays(offset: number) {
  const today = new Date();
  const day = today.getDay();
  const daysFromMon = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMon + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-asc");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getPublishedEvents()
      .then((res) => {
        if (res.ok && res.data) setEvents(res.data);
      })
      .finally(() => setLoading(false));
    setTimeout(() => setVisible(true), 10);
  }, []);

  const todayStr = new Date().toDateString();
  const weekDates = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const todayInView = weekDates.some((d) => d.toDateString() === todayStr);

  const upcomingEvents = useMemo(
    () => events.filter((e) => isEventStartDateTodayOrFuture(e.eventDate)),
    [events],
  );

  const filtered = useMemo(() => {
    const base = upcomingEvents.filter((e) => {
      if (selectedDate) {
        const day = new Date(`${selectedDate}T12:00:00`);
        if (!isCalendarDayInEventRange(day, e.eventDate, e.eventEndDate)) {
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

    const sorted = [...base];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => minTicketPrice(a) - minTicketPrice(b));
    } else if (sortBy === "newly-listed") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      sorted.sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      );
    }

    return sorted;
  }, [upcomingEvents, selectedDate, searchQuery, sortBy]);

  return (
    <div
      className={`relative min-h-screen bg-void ${SITE_HEADER_OFFSET}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "400ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat brightness-[0.35]"
        style={{ backgroundImage: "url(/hero-bg.png)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.65) 60%, rgba(10,10,10,0.85) 100%)",
        }}
      />

      <Header />

      <div className="relative z-[2] mx-auto max-w-[1100px] px-6 pt-12 pb-8 sm:px-12">
        {!todayInView && (
          <button
            type="button"
            onClick={() => {
              setWeekOffset(0);
              setSelectedDate(null);
            }}
            className="absolute top-6 right-[6%] border-none bg-transparent p-0 font-jost text-[11px] font-medium tracking-[0.06em] text-[#555555] transition-colors hover:text-gold"
          >
            back to today
          </button>
        )}

        <div className="mb-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="w-full shrink-0 lg:w-[180px] lg:pr-8">
            <p className="font-jost m-0 mb-2 text-[11px] tracking-[0.2em] text-gold uppercase">
              WHAT&apos;S ON
            </p>
            <h1 className="font-display m-0 text-[52px] leading-none font-normal text-cream">
              Events.
            </h1>
          </div>

          <div className="min-w-0 flex-1 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-1 lg:pl-8">
            <div className="flex items-center justify-between gap-0">
              <button
                type="button"
                onClick={() => setWeekOffset((v) => v - 1)}
                aria-label="Previous week"
                className="shrink-0 border-none bg-transparent px-2 py-1 text-base leading-none text-[#555555] transition-colors hover:text-gold"
              >
                ‹
              </button>

              {weekDates.map((d, i) => {
                const isToday = d.toDateString() === todayStr;
                const iso = toIsoDate(d);
                const isSelected = selectedDate === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : iso)}
                    className="flex h-[72px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent"
                  >
                    <span className="font-jost text-[10px] tracking-[0.08em] text-[#555555] uppercase">
                      {DAY_ABBR[i]}
                    </span>
                    <span
                      className="rounded-lg border px-2.5 py-1 leading-none transition-colors"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: isToday ? "32px" : "24px",
                        fontWeight: isToday ? 700 : 400,
                        color: isSelected ? "#C9A84C" : isToday ? "#F5F0E8" : "#555555",
                        background: isSelected
                          ? "rgba(201,168,76,0.15)"
                          : "transparent",
                        borderColor: isSelected
                          ? "rgba(201,168,76,0.35)"
                          : "transparent",
                      }}
                    >
                      {d.getDate()}
                    </span>
                    <div
                      className="h-1 w-1 rounded-full bg-gold"
                      style={{ opacity: isToday ? 1 : 0 }}
                    />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setWeekOffset((v) => v + 1)}
                aria-label="Next week"
                className="shrink-0 border-none bg-transparent px-2 py-1 text-base leading-none text-[#555555] transition-colors hover:text-gold"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between border-b border-border">
          <div className="flex flex-1 items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555555"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events or venues..."
              className="otl-search-input w-full max-w-[280px] border-none bg-transparent py-2.5 text-sm outline-none"
            />
          </div>

          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer appearance-none border-none bg-transparent py-2.5 pr-5 text-[13px] text-[#888888] outline-none"
            >
              <option value="date-asc">Date: soonest first</option>
              <option value="price-asc">Price: lowest first</option>
              <option value="newly-listed">Newly listed</option>
            </select>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2"
              aria-hidden
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="#888888"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <p className="font-cormorant mt-3 mb-6 text-sm text-gold italic">
          Every event includes secure resale — buy early, sell back if plans
          change.
        </p>
      </div>

      <div className="relative z-[2] mx-auto max-w-[1100px] px-6 pb-24 sm:px-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="pt-12 text-center">
            <p className="m-0 text-sm text-[#888888]">
              {selectedDate
                ? "No events on this date."
                : "No events found."}
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {filtered.map((event) => (
              <ExploreEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
