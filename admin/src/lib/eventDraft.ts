export const EVENT_DRAFT_KEY = "otl_draft_event";
export const TICKET_DRAFT_KEY = "otl_draft_tickets";

export type EventDraftForm = {
  eventName: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  lastEntry: string;
  ageRestriction: string;
  venueName: string;
  venueAddress: string;
  city: string;
  postCode: string;
  mapsLink: string;
};

export type EventDraft = EventDraftForm & {
  eventImageUrl?: string;
  imagePreview?: string;
};

export type DraftTicketTier = {
  id: string;
  name: string;
  quantity: string;
  price: string;
  cutoff: string;
};

export type DraftTicketGroup = {
  id: string;
  name: string;
  tiers: DraftTicketTier[];
};

export type TicketDraft = {
  templateKey: string | null;
  groups: DraftTicketGroup[];
};

export const EMPTY_EVENT_DRAFT: EventDraftForm = {
  eventName: "",
  description: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  lastEntry: "",
  ageRestriction: "",
  venueName: "",
  venueAddress: "",
  city: "",
  postCode: "",
  mapsLink: "",
};

export function loadEventDraft(): EventDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EVENT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EventDraft;
  } catch {
    return null;
  }
}

export function saveEventDraft(draft: EventDraft) {
  localStorage.setItem(EVENT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearEventDraft() {
  localStorage.removeItem(EVENT_DRAFT_KEY);
  localStorage.removeItem(TICKET_DRAFT_KEY);
}

export function loadTicketDraft(): TicketDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TICKET_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TicketDraft;
  } catch {
    return null;
  }
}

export function saveTicketDraft(draft: TicketDraft) {
  localStorage.setItem(TICKET_DRAFT_KEY, JSON.stringify(draft));
}

/** Parse DD/MM/YYYY HH:MM (reference format) or ISO-ish strings for API. */
export function parseTierCutoff(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );
  if (match) {
    const [, d, m, y, hh = "23", mm = "59"] = match;
    const iso = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
    );
    if (!Number.isNaN(iso.getTime())) return iso.toISOString();
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return undefined;
}
