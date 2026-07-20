"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventResponse } from "@/lib/shared";
import { createApiClient } from "@/lib/api";
import {
  formatEventDateFull,
  formatTime12h,
  getDisplayEventStatus,
  type DisplayEventStatus,
} from "@/lib/eventDisplay";
import { organiserPaths } from "@/lib/organiserPaths";

const card =
  "rounded-[10px] border border-[#222222] bg-[#141414] p-5";
const head =
  "mb-4 font-sans text-[11px] font-semibold tracking-[0.12em] text-gold uppercase";
const statLbl =
  "font-sans text-[10px] font-semibold tracking-[0.14em] text-[#888888] uppercase";

type Props = {
  event: EventResponse;
  displayStatus: DisplayEventStatus;
  token: string;
  onPublish: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function EventOverviewTab({
  event,
  displayStatus,
  token,
  onPublish,
  onCancel,
  onDelete,
}: Props) {
  const router = useRouter();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isDraft = displayStatus === "draft";
  const isPublished = displayStatus === "published";
  const isCompleted = displayStatus === "completed";
  const isCancelled = displayStatus === "cancelled";

  const runAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await fn();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = () =>
    runAction(async () => {
      const client = createApiClient(token);
      const res = await client.updateEventStatus(event.id, "published");
      if (!res.ok) throw new Error(res.message || "Failed to publish");
      onPublish();
    });

  const handleDelete = () =>
    runAction(async () => {
      const client = createApiClient(token);
      const res = await client.deleteEvent(event.id);
      if (!res.ok) throw new Error(res.message || "Failed to delete");
      onDelete();
      router.push(organiserPaths.events);
    });

  const handleCancel = () =>
    runAction(async () => {
      const client = createApiClient(token);
      const res = await client.cancelEvent(event.id);
      if (!res.ok) throw new Error(res.message || "Failed to cancel event");
      setConfirmCancel(false);
      onCancel();
    });

  const timeRange = `${formatTime12h(event.startTime)}${
    event.endTime ? ` – ${formatTime12h(event.endTime)}` : ""
  }`;

  return (
    <div className="flex flex-col gap-4">
      <div className={card}>
        <div className={head}>Event Details</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-8">
          {[
            { label: "Venue", value: `${event.venueName}, ${event.city}` },
            { label: "Date", value: formatEventDateFull(event.eventDate) },
            { label: "Time", value: timeRange },
            { label: "Category", value: event.eventCategory },
          ].map((row) => (
            <div key={row.label}>
              <div className={`${statLbl} mb-0.5`}>{row.label}</div>
              <div className="font-sans text-[13px] text-cream">{row.value}</div>
            </div>
          ))}
        </div>
        {event.eventDescription && (
          <div className="mt-4 border-t border-[#222222] pt-4">
            <div className={`${statLbl} mb-1.5`}>Description</div>
            <div className="font-sans text-[13px] leading-[1.6] text-[#888888]">
              {event.eventDescription}
            </div>
          </div>
        )}
      </div>

      {(isDraft || isPublished) && (
        <div className={card}>
          <div className={head}>Actions</div>
          <div className="flex flex-wrap gap-3">
            {isDraft && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePublish}
                className="cursor-pointer border-none bg-gold px-[22px] py-2.5 font-sans text-[13px] font-semibold text-void hover:bg-[#D4B862] disabled:opacity-50"
              >
                Publish Event
              </button>
            )}
            {isPublished && !confirmCancel && (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="cursor-pointer rounded border border-[rgba(248,113,113,0.3)] bg-transparent px-[22px] py-2.5 font-sans text-[13px] text-[#F87171] hover:border-[rgba(248,113,113,0.6)]"
              >
                Cancel Event
              </button>
            )}
            {isDraft && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="cursor-pointer rounded border border-[rgba(248,113,113,0.3)] bg-transparent px-[22px] py-2.5 font-sans text-[13px] text-[#F87171] hover:border-[rgba(248,113,113,0.6)]"
              >
                Delete Draft
              </button>
            )}
          </div>

          {confirmCancel && (
            <div className="mt-4 rounded-lg border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.05)] p-4">
              <p className="mb-3 font-sans text-[13px] text-cream">
                Cancel this event? All ticket holders will be refunded and resale
                listings closed.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleCancel}
                  className="cursor-pointer rounded border border-[rgba(248,113,113,0.3)] bg-transparent px-4 py-2 font-sans text-xs text-[#F87171] hover:border-[rgba(248,113,113,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm Cancellation
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="cursor-pointer rounded border border-[#222222] bg-transparent px-4 py-2 font-sans text-xs text-[#888888] hover:text-cream"
                >
                  Never mind
                </button>
              </div>
            </div>
          )}

          {confirmDelete && (
            <div className="mt-4 rounded-lg border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.05)] p-4">
              <p className="mb-3 font-sans text-[13px] text-cream">
                Delete this draft? This cannot be undone.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDelete}
                  className="cursor-pointer rounded border border-[rgba(248,113,113,0.3)] bg-transparent px-4 py-2 font-sans text-xs text-[#F87171] hover:border-[rgba(248,113,113,0.6)] disabled:opacity-50"
                >
                  Delete Draft
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="cursor-pointer rounded border border-[#222222] bg-transparent px-4 py-2 font-sans text-xs text-[#888888] hover:text-cream"
                >
                  Never mind
                </button>
              </div>
            </div>
          )}

          {actionError && (
            <p className="mt-3 font-sans text-xs text-rose-300">{actionError}</p>
          )}
        </div>
      )}

      {isCompleted && (
        <p className="py-2 text-center font-sans text-xs text-[#555555]">
          This event has concluded. Switch to Insights to see your resale performance.
        </p>
      )}
      {isCancelled && (
        <p className="py-2 text-center font-sans text-xs text-[#555555]">
          This event was cancelled.
        </p>
      )}
    </div>
  );
}
