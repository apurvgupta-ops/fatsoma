/** Display label for an event that may span multiple calendar days. */
export function formatEventDatesLabel(
  startIso: string,
  endIso?: string | null,
) {
  const start = new Date(startIso);
  const end = new Date(endIso ?? startIso);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  const full: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  if (sameDay) return start.toLocaleDateString("en-GB", full);
  return `${start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} – ${end.toLocaleDateString("en-GB", full)}`;
}

export function isCalendarDayInEventRange(
  day: Date,
  startIso: string,
  endIso?: string | null,
) {
  const sel = new Date(day);
  sel.setHours(0, 0, 0, 0);
  const start = new Date(startIso);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endIso ?? startIso);
  end.setHours(0, 0, 0, 0);
  return sel.getTime() >= start.getTime() && sel.getTime() <= end.getTime();
}

/** One entry per calendar day touched by an event (for week dot counts). */
export function flattenEventCalendarDays(events: {
  eventDate: string;
  eventEndDate?: string | null;
}[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    const start = new Date(e.eventDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(e.eventEndDate ?? e.eventDate);
    end.setHours(0, 0, 0, 0);
    const cur = new Date(start);
    while (cur.getTime() <= end.getTime()) {
      out.push(cur.toDateString());
      cur.setDate(cur.getDate() + 1);
    }
  }
  return out;
}
