export const BOOKING_FEE_PERCENT = 7;
export const RESALE_FEE_PERCENT = 4;

export const EVENT_CATEGORIES = [
  "Party",
  "Club Night",
  "Concert",
  "Festival",
  "Pop-Up",
  "Conference",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const USER_ROLES = ["admin", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EVENT_STATUSES = ["draft", "published"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];
