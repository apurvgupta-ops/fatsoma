import Link from "next/link";
import { getAllEvents } from "@/app/actions/events";

type Event = {
  id: string;
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  venueName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: "draft" | "published";
  ticketBatches: {
    name: string;
    quantity: number;
    basePrice: number;
    minPrice: number;
    maxPrice: number;
  }[];
};

export default async function EventsPage() {
  const events = await getAllEvents();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[140px]" />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
                <span className="h-[1px] w-10 bg-gradient-to-r from-purple-500 to-blue-400" />
                All Events
              </div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Your Event Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Manage all your events in one place. View, edit, or publish
                drafts.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110"
            >
              + Create New Event
            </Link>
          </header>

          {events.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/60 p-12 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-purple-500/40 bg-purple-500/10 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  No events yet
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Get started by creating your first event.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-block rounded-xl border border-purple-500/40 bg-purple-500/10 px-6 py-3 text-sm text-purple-200 transition hover:border-purple-400 hover:bg-purple-500/20"
                >
                  Create Event
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const totalTicketsFromBatches = event.ticketBatches.reduce(
    (acc, batch) => acc + batch.quantity,
    0,
  );

  const minRevenue = event.ticketBatches.reduce(
    (acc, batch) => acc + batch.quantity * batch.minPrice,
    0,
  );

  const maxRevenue = event.ticketBatches.reduce(
    (acc, batch) => acc + batch.quantity * batch.maxPrice,
    0,
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:border-white/20 hover:bg-zinc-950/80"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                event.status === "published"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/10 text-amber-300 border border-amber-500/40"
              }`}
            >
              {event.status === "published" ? "Published" : "Draft"}
            </span>
            <span className="rounded-full border border-white/10 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-400">
              {event.eventCategory}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition">
            {event.eventName}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
            {event.eventDescription}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <svg
            className="h-4 w-4 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{event.venueName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <svg
            className="h-4 w-4 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            {new Date(event.eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            · {event.startTime}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <svg
            className="h-4 w-4 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          <span>
            {totalTicketsFromBatches} tickets · £{minRevenue.toLocaleString()} -
            £{maxRevenue.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="absolute right-4 top-4 opacity-0 transition group-hover:opacity-100">
        <svg
          className="h-5 w-5 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
