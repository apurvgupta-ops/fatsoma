import Link from "next/link";
import { getAllEvents } from "@/app/actions/events";
import EventCard from "@/components/events/EventCard";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { auth } from "@/auth";

type Event = {
  id: string;
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  eventImage: string;
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
  const session = await auth();
  const events = await getAllEvents();

  const isAdmin = session?.user.role === "admin";

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
              <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
              {isAdmin ? "All Events" : "Your Events"}
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              {isAdmin ? "Event Management" : "Your Event Dashboard"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              {isAdmin
                ? "Manage all events across the platform. View, edit, or publish drafts."
                : "Manage all your events in one place. View, edit, or publish drafts."}
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110"
          >
            + Create New Event
          </Link>
        </header>

        {events.length === 0 ? (
          <div className="flex min-h-100 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/60 p-12 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
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
    </AuthenticatedLayout>
  );
}
