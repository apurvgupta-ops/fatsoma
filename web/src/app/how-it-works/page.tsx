"use client";

import Header, { SITE_HEADER_OFFSET } from "@/components/Header";
import Footer from "@/components/Footer";
import ResaleModelSection from "@/components/ResaleModelSection";
import {
  howItWorksPageSubtitle,
  browseBuySectionSubtitle,
  browseBuySteps,
  builtForFairnessFeatures,
} from "@/content/platformGuide";

export default function HowItWorksPage() {
  return (
    <div className={`min-h-screen bg-void text-cream/90 ${SITE_HEADER_OFFSET}`}>
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-cream/50">
            • Platform Guide
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl">
            How It <span className="text-gold">Works</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            {howItWorksPageSubtitle}
          </p>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-4xl font-bold text-cream">
            Browse & Buy
          </h2>
          <p className="mt-3 text-center text-sm text-cream/60">
            {browseBuySectionSubtitle}
          </p>
          <div className="mt-16 space-y-12">
            {browseBuySteps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-center gap-6 sm:flex-row"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface/60">
                  <step.icon className="h-8 w-8 text-gold" />
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-xs font-medium uppercase tracking-widest text-gold/70">
                    Step {step.number}
                  </span>
                  <h3 className="mt-1 text-xl font-semibold text-cream">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-cream/60">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-4xl font-bold text-cream">
            Built for Fairness
          </h2>
          <p className="mt-3 text-center text-sm text-cream/60">
            Every feature designed to protect you
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {builtForFairnessFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-surface/60 p-8"
              >
                <div className="flex justify-center">
                  <feature.icon className="h-8 w-8 text-gold" />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-cream">
                  {feature.title}
                </h3>
                <p className="mt-3 text-center text-sm leading-relaxed text-cream/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ResaleModelSection />

      <Footer />
    </div>
  );
}
