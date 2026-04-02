"use client";

import { Ticket, Percent, RefreshCw, Calculator } from "lucide-react";
import { BOOKING_FEE_PERCENT, RESALE_FEE_PERCENT } from "@/lib/shared";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  {
    icon: Ticket,
    title: "Ticket Pricing",
    description:
      "Event organisers set their own base prices for each ticket batch. Prices may change between batches as early-bird tiers sell out and new release tiers open. You always see the exact price before checkout.",
  },
  {
    icon: Percent,
    title: "Smart Timing Fee",
    description: `A platform booking fee of ${BOOKING_FEE_PERCENT}% is added at checkout. This fee covers secure payment processing, QR code generation, and platform operations. In the future, the Smart Timing Fee will adjust dynamically based on demand and proximity to the event — starting low and rising as the event approaches.`,
  },
  {
    icon: RefreshCw,
    title: "Resale Fees",
    description: `A ${RESALE_FEE_PERCENT}% resale fee applies to resale purchases. When you sell a ticket, you receive your original base purchase price back in full. The buyer pays the listing price plus the ${RESALE_FEE_PERCENT}% resale fee.`,
  },
  {
    icon: Calculator,
    title: "No Hidden Costs",
    description:
      "What you see is what you pay. The total at checkout includes the ticket price plus the booking fee — nothing else. No service charges, no processing fees, no surprises.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-cream/90">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-cream/50">
            • Transparent Pricing
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl">
            Simple, <span className="text-gold">Fair</span> Pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            No hidden fees, no scalper markups. Just the ticket price plus a
            transparent booking fee.
          </p>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section) => (
              <div
                key={section.title}
                className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-surface/60 p-8 sm:flex-row sm:p-10"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-void/60">
                  <section.icon className="h-7 w-7 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cream">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-cream/60">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gold/30 bg-surface/60 p-10 sm:p-12">
            <h2 className="text-center font-serif text-3xl font-bold text-cream">
              Pricing Breakdown
            </h2>
            <p className="mt-2 text-center text-sm text-cream/60">
              Here&apos;s what a typical purchase looks like
            </p>
            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <span className="text-sm text-cream/80">Base ticket price</span>
                <span className="font-mono text-sm font-semibold text-cream">
                  £XX.XX
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <span className="text-sm text-cream/80">
                  Booking fee ({BOOKING_FEE_PERCENT}%)
                </span>
                <span className="font-mono text-sm font-semibold text-gold">
                  + £X.XX
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-semibold text-cream">
                  Total
                </span>
                <span className="font-mono text-lg font-bold text-gold">
                  = £XX.XX
                </span>
              </div>
            </div>
            <p className="mt-8 text-center text-xs leading-relaxed text-cream/50">
              The booking fee is currently a flat {BOOKING_FEE_PERCENT}% applied
              to the ticket base price. This covers payment processing, QR
              generation, and platform maintenance.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

