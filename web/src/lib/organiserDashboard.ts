/** Organiser app (admin) URL for “list your event” links. Override in production via env. */
export const ORGANISER_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_ORGANISER_DASHBOARD_URL?.trim() ||
  "https://admin.onthelistapp.co.uk/organiser-dashboard";
