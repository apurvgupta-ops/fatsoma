import Link from "next/link";
import type { TicketTotals } from "@/types/event-form";

type Props = {
  isSubmitting: boolean;
  eventName: string;
  eventCategory: string;
  totals: TicketTotals;
  onSaveDraft: () => void;
};

export default function PublishSidebar({
  isSubmitting,
  eventName,
  eventCategory,
  totals,
  onSaveDraft,
}: Props) {
  return (
    <aside className="space-y-6">
      <div className="sticky top-6 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <h2 className="text-lg font-semibold text-white">Publish controls</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Save progress or publish when ready.
          </p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Publishing..." : "Publish Event"}
            </button>
            <Link
              href="/events"
              className="flex w-full items-center justify-center rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-sm text-purple-200 transition hover:border-purple-400 hover:bg-purple-500/20"
            >
              View All Events
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Live summary
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {eventName || "Untitled event"}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            {eventCategory || "Category"} · {totals.tickets} tickets
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-400">
            Next step: finalize ticket batches for release schedule.
          </div>
        </section>
      </div>
    </aside>
  );
}
