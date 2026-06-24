"use client";

import {
  ContentPageLayout,
  PageHero,
  FadeInSection,
} from "@/components/content/ContentPage";

const clauses = [
  {
    n: "1.",
    heading: "Acceptance of terms",
    body: "By accessing or using On The List, you agree to be bound by these Terms of Use. If you do not agree, you may not use the platform. These terms apply to all visitors, buyers, sellers, and event organisers.",
  },
  {
    n: "2.",
    heading: "The resale model",
    body: "On The List operates a controlled resale system. When you list a ticket for resale, the resale price is set automatically to the current tier price — the same price any new buyer would pay at that moment. You may not set a higher or lower price. This is enforced at the platform level, not by policy.",
  },
  {
    n: "3.",
    heading: "No profit on resale",
    body: "You may not profit from reselling a ticket on this platform. The resale model is designed such that profit is structurally impossible. Any attempt to circumvent this through external arrangements is a breach of these terms and may result in account termination.",
  },
  {
    n: "4.",
    heading: "Ticket validity",
    body: "Each ticket is uniquely identified by a QR code. Upon a completed resale transaction, the seller's QR code is permanently invalidated and a new code is issued to the buyer in the same atomic transaction. On The List accepts no liability for tickets purchased or transferred outside of this platform.",
  },
  {
    n: "5.",
    heading: "Payments",
    body: "All payments are processed securely via third-party payment providers. Booking fees and resale fees are shown to you before you confirm any transaction. On The List does not store payment card details. Refunds are issued in accordance with the specific event's policy and these terms.",
  },
  {
    n: "6.",
    heading: "Governing law",
    body: "These terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from use of this platform shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
  },
  {
    n: "7.",
    heading: "Contact",
    body: "Questions about these terms should be directed to hello@onthelyst.com. On The List is operated from London, United Kingdom.",
  },
];

export default function TermsPage() {
  return (
    <ContentPageLayout>
      <PageHero
        eyebrow="Legal"
        title="Terms of use."
        meta="Last updated June 2026"
      />

      <FadeInSection style={{ maxWidth: "680px" }}>
        {clauses.map((clause, index) => (
          <div
            key={clause.n}
            className="grid grid-cols-[32px_1fr] gap-6 py-9"
            style={{
              borderBottom:
                index < clauses.length - 1
                  ? "1px solid rgba(201,168,76,0.08)"
                  : "none",
            }}
          >
            <span className="pt-0.5 font-sans text-xs font-semibold text-gold">
              {clause.n}
            </span>
            <div>
              <h3 className="m-0 mb-3 font-sans text-sm font-semibold tracking-[0.04em] text-cream uppercase">
                {clause.heading}
              </h3>
              <p className="m-0 font-sans text-sm font-light leading-[1.9] text-[rgba(245,240,232,0.65)]">
                {clause.body}
              </p>
            </div>
          </div>
        ))}
      </FadeInSection>
    </ContentPageLayout>
  );
}
