"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import type { EventResponse } from "@/lib/shared";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatEventMeta,
  getDisplayEventStatus,
  type EventInsightsData,
} from "@/lib/eventDisplay";
import { organiserPaths } from "@/lib/organiserPaths";
import { OtlBackIcon } from "@/components/organiser/OtlFormPrimitives";
import { EditEventPanel } from "@/components/organiser/EditEventPanel";
import { EventOverviewTab } from "./EventOverviewTab";
import { EventInsightsTab } from "./EventInsightsViews";

type Tab = "overview" | "insights";

export function OrganiserEventDetail({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [insights, setInsights] = useState<EventInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backHover, setBackHover] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const client = createApiClient(token);
    const [eventRes, insightsRes] = await Promise.all([
      client.getEvent(eventId),
      client.getEventInsights(eventId),
    ]);
    if (eventRes.ok && eventRes.data) setEvent(eventRes.data);
    if (insightsRes.ok && insightsRes.data) setInsights(insightsRes.data);
    setLoading(false);
  }, [eventId, token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-10 py-9 font-sans text-[13px] text-[#555555]">
        Event not found.
      </div>
    );
  }

  if (editing && token) {
    return (
      <EditEventPanel
        event={event}
        token={token}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          load();
          setSaveSuccess(true);
          window.setTimeout(() => setSaveSuccess(false), 3000);
        }}
      />
    );
  }

  const displayStatus = getDisplayEventStatus(event);
  const statusColor = STATUS_COLORS[displayStatus];
  const statusLabel = STATUS_LABELS[displayStatus];
  const isDraft = displayStatus === "draft";
  const isCancelled = displayStatus === "cancelled";
  const isCompleted = displayStatus === "completed";
  const canEdit = !isCancelled && !isCompleted;

  return (
    <div className="relative z-[1] flex flex-1 flex-col overflow-y-auto px-10 py-9">
      <button
        type="button"
        onClick={() => router.push(organiserPaths.events)}
        onMouseEnter={() => setBackHover(true)}
        onMouseLeave={() => setBackHover(false)}
        className="mb-6 flex w-fit cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 font-sans text-[13px] transition-colors duration-150"
        style={{ color: backHover ? "#F5F0E8" : "#888888" }}
      >
        <OtlBackIcon />
        Back to Events
      </button>

      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <span
            className="mb-2.5 inline-block rounded-full px-2.5 py-0.5 font-sans text-[9px] font-semibold tracking-[0.14em] uppercase"
            style={{
              color: statusColor,
              border: `1px solid ${statusColor}33`,
            }}
          >
            {statusLabel}
          </span>
          <h1 className="m-0 mb-1.5 font-sans text-[26px] font-bold text-cream">
            {event.eventName}
          </h1>
          <p className="m-0 font-sans text-[13px] text-[#888888]">
            {formatEventMeta(event)}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 shrink-0 cursor-pointer rounded border border-[#222222] bg-transparent px-[22px] py-2.5 font-sans text-[13px] text-[#888888] transition-colors hover:border-[#888888] hover:text-cream"
          >
            Edit Event
          </button>
        )}
      </div>

      <div className="mb-7 flex border-b border-[#222222]">
        {(["overview", "insights"] as const).map((t) => {
          const isActive = tab === t;
          const isInsights = t === "insights";
          const isDisabled = isDraft && isInsights;
          return (
            <button
              key={t}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && setTab(t)}
              className="mr-8 cursor-pointer border-none bg-transparent py-3 font-sans text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors duration-150 disabled:cursor-default"
              style={{
                color: isDisabled
                  ? "#555555"
                  : isInsights
                    ? isActive
                      ? "#F5F0E8"
                      : "#C9A84C"
                    : isActive
                      ? "#F5F0E8"
                      : "#888888",
                fontWeight: isInsights ? 700 : 600,
                borderBottom: isActive
                  ? `2px solid ${isInsights ? "#F5F0E8" : "#C9A84C"}`
                  : "2px solid transparent",
                opacity: isDisabled ? 0.4 : 1,
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          );
        })}
      </div>

      {tab === "overview" && token && (
        <EventOverviewTab
          event={event}
          displayStatus={displayStatus}
          token={token}
          onPublish={() => {
            load();
            setSaveSuccess(true);
            window.setTimeout(() => setSaveSuccess(false), 3000);
          }}
          onCancel={() => {
            load();
            setSaveSuccess(true);
            window.setTimeout(() => setSaveSuccess(false), 3000);
          }}
          onDelete={() => {}}
        />
      )}

      {tab === "insights" && (
        <EventInsightsTab
          event={event}
          displayStatus={displayStatus}
          insights={insights}
        />
      )}

      {saveSuccess && (
        <div className="fixed right-8 bottom-6 z-[200] flex items-center gap-2.5 rounded-lg border border-[rgba(74,222,128,0.35)] bg-[#141414] px-5 py-3 font-sans text-[13px] text-cream shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <span className="text-[15px] text-[#4ADE80]">✓</span>
          Changes saved successfully
        </div>
      )}
    </div>
  );
}
