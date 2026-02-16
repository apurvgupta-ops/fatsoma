import Link from "next/link";

export default function PageHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
          <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
          Organizer Admin Panel
        </div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Create and publish your next event
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Build a premium experience with dynamic pricing, flexible ticket
          batches, and live revenue insights.
        </p>
      </div>
      <Link
        href="/events"
        className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800"
      >
        View All Events
      </Link>
    </header>
  );
}
