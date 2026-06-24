"use client";

import {
  ContentPageLayout,
  PageHero,
  FadeInSection,
} from "@/components/content/ContentPage";

const highlights = [
  { label: "RESALE OPENS", value: "Day one" },
  { label: "RESALE CLOSES", value: "1 hr before", gold: true },
  { label: "YOU RECEIVE", value: "Full ticket price" },
  { label: "BOOKING FEE", value: "Non-refundable", gold: true },
];

const sections = [
  {
    n: "01",
    heading: "Our position on refunds.",
    body: "On The List does not offer cash refunds for change of mind. Instead, we offer something better: resale. If your plans change, list your ticket on the platform and recover every penny you paid for it the moment someone buys it. This is available from the day you purchase, right up to one hour before the event.",
  },
  {
    n: "02",
    heading: "How resale works as a refund.",
    body: "When your resale ticket sells, you receive back exactly your original purchase price — no more, no less. The buyer pays the current tier price. Any difference between what you paid and the current price goes to the organiser, not to a scalper. Your booking fee is not refunded, but you keep the full ticket price.",
  },
  {
    n: "03",
    heading: "The one-hour cutoff.",
    body: "Resale listings close automatically one hour before the event starts. Any ticket still listed at that point reverts to valid status in your account. No resale can complete inside this window.",
  },
  {
    n: "04",
    heading: "Event cancellation.",
    body: "If an event is cancelled by the organiser, all ticket holders will receive a full refund of the ticket price and booking fee to their original payment method, processed within 5 to 10 business days.",
  },
  {
    n: "05",
    heading: "Tickets purchased outside this platform.",
    body: "On The List accepts no responsibility for tickets purchased through third-party channels, social media, or peer-to-peer arrangements. Only tickets purchased directly through onthelyst.com carry the protections described here.",
  },
  {
    n: "06",
    heading: "Contact.",
    body: "Refund queries should be directed to hello@onthelyst.com with your order reference.",
  },
];

export default function RefundsPage() {
  return (
    <ContentPageLayout>
      <PageHero
        eyebrow="Policies"
        title="Refunds & resale."
        meta="Last updated June 2026"
        titleClassName="font-display text-[clamp(40px,6vw,72px)] font-light italic leading-[1.05] text-cream"
      />

      <FadeInSection style={{ paddingBottom: 0 }}>
        <div className="mb-20 grid grid-cols-1 overflow-hidden rounded border border-[rgba(201,168,76,0.1)] bg-[rgba(201,168,76,0.1)] sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.label} className="bg-void px-7 py-8">
              <p className="m-0 mb-2.5 font-sans text-[10px] font-medium tracking-[0.18em] text-[rgba(245,240,232,0.65)] uppercase">
                {item.label}
              </p>
              <p
                className={`font-display m-0 text-[32px] leading-[1.1] font-light italic ${
                  item.gold ? "text-gold" : "text-cream"
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </FadeInSection>

      <FadeInSection style={{ paddingTop: 0 }}>
        {sections.map((section, index) => (
          <div key={section.n}>
            <div className="grid grid-cols-1 items-start gap-8 py-12 sm:grid-cols-[clamp(60px,8vw,96px)_1fr]">
              <span className="font-display text-right text-[clamp(3rem,7vw,5rem)] leading-none text-[rgba(206,166,85,0.15)] select-none">
                {section.n}
              </span>
              <div className="pt-1.5">
                <h3 className="font-display m-0 mb-3.5 text-[26px] leading-[1.2] font-normal text-cream italic">
                  {section.heading}
                </h3>
                <p className="m-0 font-sans text-sm font-light leading-[1.9] text-[rgba(245,240,232,0.65)]">
                  {section.body}
                </p>
              </div>
            </div>
            {index < sections.length - 1 && (
              <div className="h-px bg-[rgba(201,168,76,0.08)]" />
            )}
          </div>
        ))}
      </FadeInSection>
    </ContentPageLayout>
  );
}
