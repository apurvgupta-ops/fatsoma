"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventResponse } from "@/lib/shared";
import { organiserPaths } from "@/lib/organiserPaths";
import {
  PanelShell,
  PanelEyebrow,
  PanelTitle,
  StatGrid,
  EventPreviewCard,
  GoldButton,
} from "@/components/organiser/OrganiserUi";

export default function OrganiserDashboardPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const client = createApiClient(token);
    client
      .getEvents()
      .then((eventsRes) => {
        if (eventsRes.ok && eventsRes.data) setEvents(eventsRes.data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const isOrganizer = user?.role === "organizer";

  const published = events.filter((e) => e.status === "published").length;
  const grossRevenue = events.reduce(
    (sum, event) =>
      sum +
      event.ticketBatches.reduce((tierSum, batch) => tierSum + batch.quantity * batch.basePrice, 0),
    0,
  );

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, 4);

  const stats = [
    { label: "TOTAL EVENTS", value: String(events.length) },
    { label: "PUBLISHED", value: String(published) },
    { label: "RECOVERED FROM RESALE, ALL-TIME", value: "£0" },
    { label: "GROSS REVENUE", value: `£${grossRevenue.toLocaleString()}` },
  ];

  return (
    <AuthenticatedLayout>
      <PanelShell>
        <PanelEyebrow>Organizer Admin Panel</PanelEyebrow>
        <PanelTitle
          title="Dashboard"
          subtitle="Overview of your events and platform metrics."
          action={
            isOrganizer ? (
              <GoldButton href={organiserPaths.withdrawals}>Withdraw</GoldButton>
            ) : undefined
          }
        />

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : (
          <>
            <StatGrid stats={stats} />

            <div className="mb-5 flex items-center justify-between">
              <span className="font-sans text-[15px] font-semibold text-cream">
                Recent Events
              </span>
              <Link
                href={organiserPaths.events}
                className="border-none bg-transparent p-0 font-sans text-xs text-gold no-underline transition-colors hover:text-cream"
              >
                View all →
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <p className="font-sans text-[13px] text-[#555555]">No events yet.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                {recentEvents.map((event) => (
                  <EventPreviewCard
                    key={event.id}
                    event={event}
                    href={organiserPaths.event(event.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PanelShell>
    </AuthenticatedLayout>
  );
}
