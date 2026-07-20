import type { EventResponse } from "@/lib/shared";

export function getEventStartDateTime(
  event: Pick<EventResponse, "eventDate" | "startTime">,
): Date {
  const d = new Date(event.eventDate);
  const [h, m] = event.startTime?.split(":").map(Number) ?? [0, 0];
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** True when more than 6 hours remain before the event start. */
export function canEditEventCopy(
  event: Pick<EventResponse, "eventDate" | "startTime">,
): boolean {
  const start = getEventStartDateTime(event);
  const sixHoursMs = 6 * 60 * 60 * 1000;
  return Date.now() < start.getTime() - sixHoursMs;
}
