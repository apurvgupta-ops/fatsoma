"use client";

import {
  ContentPageLayout,
  PageHero,
  FadeInSection,
  ContentDivider,
  BodyText,
  SectionHeading,
} from "@/components/content/ContentPage";

const sections = [
  {
    heading: "What we collect.",
    body: "We collect the information you give us when you create an account (name and email address), payment information processed securely through our payment provider (we never store card details), and event and ticket activity associated with your account.",
  },
  {
    heading: "How we use it.",
    body: "Your information is used to operate the platform — processing purchases, issuing tickets, executing resales, and sending you relevant notifications about your tickets and account. We do not sell your data. We do not use it for advertising.",
  },
  {
    heading: "Payments.",
    body: "All payments are processed by Stripe. On The List does not store, see, or handle your card details at any point. Stripe's own privacy policy applies to payment data.",
  },
  {
    heading: "Ticket data.",
    body: "Each ticket is linked to a buyer identity for security and door scanning purposes. When a ticket is transferred via resale, ownership data updates accordingly. Historical transaction records are retained for fraud prevention and dispute resolution.",
  },
  {
    heading: "Your rights.",
    body: "You have the right to access the personal data we hold about you, request corrections, and request deletion of your account and associated data, subject to legal retention requirements. To exercise these rights, contact hello@onthelyst.com.",
  },
  {
    heading: "Cookies.",
    body: "We use essential cookies to keep you signed in and to maintain your session. We do not use tracking or advertising cookies.",
  },
  {
    heading: "Contact.",
    body: "Privacy questions should be directed to hello@onthelyst.com. On The List is operated from London, United Kingdom.",
  },
];

export default function PrivacyPage() {
  return (
    <ContentPageLayout>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy."
        meta="Last updated June 2026"
      />

      <FadeInSection style={{ maxWidth: "680px" }}>
        {sections.map((section, index) => (
          <div key={section.heading}>
            <SectionHeading>{section.heading}</SectionHeading>
            <BodyText>{section.body}</BodyText>
            {index < sections.length - 1 && (
              <div className="my-10 h-px bg-[rgba(201,168,76,0.08)]" />
            )}
          </div>
        ))}
      </FadeInSection>
    </ContentPageLayout>
  );
}
