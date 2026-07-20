export const ORGANISER_BASE = "/organiser-dashboard";

export const organiserPaths = {
  dashboard: ORGANISER_BASE,
  events: `${ORGANISER_BASE}/events`,
  createEvent: `${ORGANISER_BASE}/events/create`,
  addTickets: `${ORGANISER_BASE}/add-tickets`,
  event: (id: string) => `${ORGANISER_BASE}/events/${id}`,
  eventEdit: (id: string) => `${ORGANISER_BASE}/events/${id}/edit`,
  payments: `${ORGANISER_BASE}/payments`,
  withdrawals: `${ORGANISER_BASE}/withdrawals`,
  staff: `${ORGANISER_BASE}/staff`,
  login: "/login",
  scanner: "/scanner",
  users: "/users",
  withdrawRequests: "/withdraw-requests",
} as const;
