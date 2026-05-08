import { resaleModelSummary } from "@/content/platformGuide";

function FlowRow({
  label,
  value,
  valueClass = "text-cream",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-cream/55">{label}</span>
      <span className={`shrink-0 text-right font-medium ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export default function ResaleModelSection() {
  return (
    <section className="relative border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80">
              The resale model
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-cream sm:text-4xl">
              Here&apos;s exactly how the money moves
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream/65 sm:text-base">
              You buy early and get a good price. If you resell, you get back
              what you paid — not more, not less. Any price increase since your
              purchase flows back to the organiser. Nobody scalps, because
              there&apos;s no profit in it.
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-surface/60 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold/70">
                Stage 1
              </p>
              <h3 className="mt-1 text-sm font-bold text-cream">
                Monday — Early bird
              </h3>
              <p className="mt-3 text-xs text-cream/50">You buy a ticket</p>
              <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                <FlowRow label="Tier price" value="£10" />
                <FlowRow label="You pay" value="£10 + fee" />
                <FlowRow
                  label="Organiser receives"
                  value="£10"
                  valueClass="text-gold"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold/70">
                Stage 2
              </p>
              <h3 className="mt-1 text-sm font-bold text-cream">
                Friday — Final tier
              </h3>
              <p className="mt-3 text-xs text-cream/50">You list for resale</p>
              <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                <FlowRow label="Tier price is now" value="£30" />
                <FlowRow label="Listing price" value="£30" />
                <p className="text-xs text-cream/40">
                  Set by platform — not by you
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/60 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold/70">
                Stage 3
              </p>
              <h3 className="mt-1 text-sm font-bold text-cream">
                Someone buys your listing
              </h3>
              <p className="mt-2 text-xs text-cream/55">
                Transfer complete. Your QR cancelled.
              </p>
              <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                <FlowRow label="You get back" value="£10" />
                <FlowRow
                  label="Organiser gets"
                  value="£20"
                  valueClass="text-gold"
                />
                <FlowRow
                  label="Scalper gets"
                  value="£0"
                  valueClass="text-cream/45"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-gold/25 bg-gold/10 p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-cream/90 sm:text-base">
            {resaleModelSummary}
          </p>
        </div>
      </div>
    </section>
  );
}
