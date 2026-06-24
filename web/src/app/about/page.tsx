"use client";

import {
  ContentPageLayout,
  PageHero,
  FadeInSection,
  ContentDivider,
  BodyText,
  SectionHeading,
} from "@/components/content/ContentPage";

export default function AboutPage() {
  return (
    <ContentPageLayout>
      <PageHero
        eyebrow="Our story"
        title={
          <>
            Built for students who don&apos;t know what Friday looks like yet.
          </>
        }
        meta="London, 2026"
      />

      <FadeInSection narrow>
        <SectionHeading>The problem we noticed.</SectionHeading>
        <BodyText>
          Every ticket platform assumes you know you&apos;re going. Buy early,
          lock in, show up. But student life doesn&apos;t work like that. Plans
          change. Flatmates drop out. Exams move. And when they do, your options
          are selling on WhatsApp for less than you paid, or eating the loss. We
          thought that was broken.
        </BodyText>

        <ContentDivider />

        <SectionHeading>What we built.</SectionHeading>
        <BodyText>
          On The List is a student ticket marketplace with secure resale built
          in from day one. Not as an afterthought. Not as a separate product.
          Every ticket sold here comes with the ability to list it back, at a
          fair price, the moment your plans change. No DMs, no strangers, no
          risk.
        </BodyText>

        <ContentDivider />

        <SectionHeading>The resale model.</SectionHeading>
        <BodyText>
          Our resale system is designed to be impossible to abuse. When you list
          a ticket for resale, the price is set to whatever the current tier is
          selling for — the same price any new buyer would pay right now. You get
          back exactly what you paid. Not more, not less. The scalping incentive
          is gone, structurally, not by policy.
        </BodyText>

        <ContentDivider />

        <SectionHeading>Based in London.</SectionHeading>
        <BodyText>
          We started in London because London has the student events scene. LSE,
          UCL, King&apos;s, Imperial — and a hundred club nights, balls, and
          socials between them. That&apos;s where we&apos;re building first.
        </BodyText>
      </FadeInSection>

      <FadeInSection narrow style={{ paddingTop: 0 }}>
        <div className="mb-14 h-px bg-[rgba(201,168,76,0.1)]" />
        <p className="m-0 mb-3 font-sans text-[11px] font-medium tracking-[0.2em] text-gold uppercase">
          Get in touch
        </p>
        <a
          href="mailto:hello@onthelyst.com"
          className="font-display inline-block text-[32px] font-bold text-cream no-underline transition-colors hover:text-gold"
        >
          hello@onthelyst.com
        </a>
      </FadeInSection>
    </ContentPageLayout>
  );
}
