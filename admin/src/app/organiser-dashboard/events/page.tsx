"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventResponse } from "@/lib/shared";
import { organiserPaths } from "@/lib/organiserPaths";
import {
  PanelShell,
  PanelEyebrow,
  PanelTitle,
  GoldButton,
  EventPreviewCard,
  OtlSearchInput,
} from "@/components/organiser/OrganiserUi";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Upcoming" },
  { key: "draft", label: "Draft" },
] as const;

export default function OrganiserEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof STATUS_TABS)[number]["key"]>("all");
  const [search, setSearch] = useState("");

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
    return events
      .filter((event) => filter === "all" || event.status === filter)
      .filter((event) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          event.eventName.toLowerCase().includes(q) ||
          event.venueName.toLowerCase().includes(q)
        );
      });
  }, [events, filter, search]);

  return (
    <AuthenticatedLayout>
      <PanelShell>
        <PanelEyebrow>Event Management</PanelEyebrow>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 font-sans text-[28px] font-bold text-cream">Your Events</h1>
            <p className="mt-1.5 mb-0 font-sans text-[13px] text-[#888888]">
              Manage all your events in one place.
            </p>
          </div>
          <GoldButton href={organiserPaths.createEvent}>+ Create New Event</GoldButton>
        </div>

        <div className="mb-4">
          <OtlSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search events by name..."
          />
        </div>

        <div className="mb-7 flex border-b border-[#222222]">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? events.length
                : events.filter((event) => event.status === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`mr-8 cursor-pointer border-none bg-transparent py-2.5 font-sans text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                  active
                    ? "border-b-2 border-gold text-cream"
                    : "border-b-2 border-transparent text-[#555555] hover:text-[#888888]"
                }`}
              >
                {tab.label}{" "}
                {count > 0 && <span className="opacity-55">({count})</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="pt-5 font-sans text-[13px] text-[#555555]">
            {search.trim()
              ? `No events match "${search.trim()}".`
              : "No events in this category."}
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,320px))] gap-5">
            {filtered.map((event) => (
              <EventPreviewCard
                key={event.id}
                event={event}
                href={organiserPaths.event(event.id)}
              />
            ))}
          </div>
        )}
      </PanelShell>
    </AuthenticatedLayout>
  );
}
