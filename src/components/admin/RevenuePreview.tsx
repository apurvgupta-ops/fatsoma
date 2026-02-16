import type { TicketTotals } from "@/types/event-form";

type Props = {
  totals: TicketTotals;
  bookingFee: number;
  platformCommission: number;
};

export default function RevenuePreview({
  totals,
  bookingFee,
  platformCommission,
}: Props) {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-zinc-950 via-zinc-950 to-purple-950/40 p-5">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-6 top-10 h-20 w-20 rounded-full bg-purple-500/30 blur-2xl" />
          <div className="absolute bottom-4 right-8 h-16 w-16 rounded-full bg-blue-500/30 blur-2xl" />
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Price preview
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Animated revenue curve
          </h3>
          <div className="mt-4 flex h-24 items-end gap-2 rounded-xl border border-white/10 bg-zinc-950/60 p-3">
            {[30, 60, 42, 80, 55, 95, 65].map((height, index) => (
              <div
                key={`${height}-${index}`}
                className="flex-1 rounded-lg bg-linear-to-t from-purple-500/80 to-blue-400/90"
                style={{
                  height: `${height}%`,
                  animation: "floatGlow 5s ease-in-out infinite",
                  animationDelay: `${index * 0.3}s`,
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Placeholder for a dynamic pricing graph.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Potential revenue
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          £{totals.minRevenue.toLocaleString()} - £
          {totals.maxRevenue.toLocaleString()}
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          Estimated based on batch ranges.
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
          Booking fee: {bookingFee}% · Platform commission: {platformCommission}
          %
        </div>
      </div>
    </div>
  );
}
