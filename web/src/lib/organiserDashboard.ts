/** Organiser app (admin) URL for “list your event” links. Override in production via env. */
export const ORGANISER_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_ORGANISER_DASHBOARD_URL?.trim() ||
  "http://localhost:3003/organiser-dashboard";
