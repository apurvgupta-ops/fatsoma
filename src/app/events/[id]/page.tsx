import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/app/actions/events";
import EventImage from "@/components/events/EventImage";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const totalTickets = event.ticketBatches.reduce(
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
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-purple-300 transition hover:text-purple-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all events
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    event.status === "published"
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {event.status === "published" ? "Published" : "Draft"}
                </span>
                <span className="rounded-full border border-white/10 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400">
                  {event.eventCategory}
                </span>
              </div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {event.eventName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-400">
                Created {new Date(event.createdAt).toLocaleDateString("en-GB")}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/events/${event.id}/edit`}
                className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800"
              >
                Edit
              </Link>
              <button className="rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110">
                Share
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Event Details
              </h2>
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Description
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {event.eventDescription}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <EventImage
                    src={event.eventImage}
                    alt={event.eventName}
                    title="Event Image"
                    priority
                  />
                  {event.eventBanner && (
                    <EventImage
                      src={event.eventBanner}
                      alt={`${event.eventName} banner`}
                      title="Banner"
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Location
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Venue
                  </p>
                  <p className="mt-2 text-base font-medium text-zinc-200">
                    {event.venueName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Address
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {event.addressLine}
                    <br />
                    {event.city}, {event.postcode}
                    <br />
                    {event.country}
                  </p>
                </div>
                {event.mapsLink ? (
                  <div>
                    <a
                      href={event.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-purple-300 transition hover:text-purple-200"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View on Google Maps
                    </a>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Date & Time
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Date
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {new Date(event.eventDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Start Time
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {event.startTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    End Time
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">{event.endTime}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Ticket Batches
              </h2>
              <div className="space-y-3">
                {event.ticketBatches.map((batch, index) => (
                  <div
                    key={`${batch.name}-${index}`}
                    className="rounded-xl border border-white/10 bg-zinc-950/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-medium text-white">{batch.name}</h3>
                      <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
                        {batch.quantity} tickets
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500">Base Price</p>
                        <p className="mt-1 text-sm text-zinc-300">
                          £{batch.basePrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Min Price</p>
                        <p className="mt-1 text-sm text-zinc-300">
                          £{batch.minPrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Max Price</p>
                        <p className="mt-1 text-sm text-zinc-300">
                          £{batch.maxPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Pricing Settings
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Dynamic Pricing
                  </p>
                  <p className="mt-2 text-base font-medium text-zinc-200">
                    {event.dynamicPricing ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Ticket Resale
                  </p>
                  <p className="mt-2 text-base font-medium text-zinc-200">
                    {event.allowResale ? "Allowed" : "Not Allowed"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Booking Fee
                  </p>
                  <p className="mt-2 text-base font-medium text-zinc-200">
                    {event.bookingFee}%
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Platform Commission
                  </p>
                  <p className="mt-2 text-base font-medium text-zinc-200">
                    {event.platformCommission}%
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-6 space-y-6">
              <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <h2 className="text-lg font-semibold text-white">
                  Event Summary
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Total Tickets
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {totalTickets}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      of {event.totalTickets} capacity
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-linear-to-br from-zinc-950 via-zinc-950 to-purple-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Revenue Range
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      £{minRevenue.toLocaleString()} - £
                      {maxRevenue.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Potential earnings
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Event ID
                    </p>
                    <p className="mt-2 font-mono text-xs text-zinc-400">
                      {event.id}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
