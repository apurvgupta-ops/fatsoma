import type { EventResponse } from "@/lib/shared";

export type DisplayEventStatus = "draft" | "published" | "completed" | "cancelled";

export const STATUS_COLORS: Record<DisplayEventStatus, string> = {
  published: "#C9A84C",
  completed: "#555555",
  draft: "#555555",
  cancelled: "#F87171",
};

export const STATUS_LABELS: Record<DisplayEventStatus, string> = {
  published: "UPCOMING",
  completed: "COMPLETED",
  draft: "DRAFT",
  cancelled: "CANCELLED",
};

export function getDisplayEventStatus(event: EventResponse): DisplayEventStatus {
  if (event.status === "cancelled") return "cancelled";
  if (event.status === "draft") return "draft";
  const end = new Date(event.eventEndDate ?? event.eventDate);
  end.setHours(23, 59, 59, 999);
  if (end.getTime() < Date.now()) return "completed";
  return "published";
}

export function formatTime12h(time: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}

export function formatEventDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatEventMeta(event: EventResponse) {
  const date = formatEventDateFull(event.eventDate);
  const time = formatTime12h(event.startTime);
  return `${event.venueName}, ${event.city} · ${date} · ${time}`;
}

export type TierView = {
  name: string;
  price: number;
  capacity: number;
  sold: number;
};

export function getTierViews(event: EventResponse): TierView[] {
  return event.ticketBatches.map((batch) => ({
    name: batch.name,
    price: batch.basePrice,
    capacity: batch.quantity,
    sold: Math.max(0, batch.quantity - (batch.remaining ?? 0)),
  }));
}

export interface EventInsightsData {
  recovered: number;
  totalResales: number;
  emptySeatsRescued: number;
  repeatBuyerPct: number;
  showUpResale: number;
  showUpPrimary: number;
  ticketsRefunded: number;
  velocityData: { label: string; count: number }[];
  eventsPerYear: number;
  tierUpgrades: ({ count: number; from: string; earned: number } | null)[];
}
