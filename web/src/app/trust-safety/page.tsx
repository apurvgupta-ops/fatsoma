"use client";

import { ShieldCheck, QrCode, UserCheck, Lock, Database } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const policies = [
  {
    icon: ShieldCheck,
    title: "No Scalping Policy",
    description:
      "Resale tickets are always capped at the current release price. You will never pay more than what the organiser has set for the active ticket batch. This isn't just a guideline — it's enforced at the platform level.",
    highlights: [
      "Resale price capped at current tier",
      "Automatic price enforcement",
      "Transparent fee structure",
    ],
  },
  {
    icon: QrCode,
    title: "Verified Transfers",
    description:
      "When a ticket is resold, the original QR code is immediately invalidated and a brand-new one is generated for the buyer. There is never a window where two valid tickets exist. Every transfer is atomic and tamper-proof.",
    highlights: [
      "Instant QR code invalidation",
      "New QR generated for buyer",
      "Zero duplicate ticket risk",
    ],
  },
  {
    icon: UserCheck,
    title: "Student Verification",
    description:
      "On The List is built for verified students. Our platform ensures that ticket holders are genuine members of the student community, keeping events safe and authentic.",
    highlights: [
      "Student-only platform",
      "Identity verification",
      "Community trust",
    ],
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description:
      "All payments are processed through Stripe, the industry standard for online payments. Your card details never touch our servers — everything is handled by Stripe's PCI-compliant infrastructure.",
    highlights: [
      "Stripe-powered checkout",
      "PCI DSS compliant",
      "Card details never stored",
    ],
  },
  {
    icon: Database,
    title: "Data Protection",
    description:
      "We take your data seriously. All personal information is encrypted at rest and in transit. We are fully GDPR compliant and never sell or share your data with third parties.",
    highlights: [
      "GDPR compliant",
      "End-to-end encryption",
      "No data sharing with third parties",
    ],
  },
];

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-cream/90">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-cream/50">
            • Your Safety First
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl">
            Trust & <span className="text-gold">Safety</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            Every layer of our platform is built around protecting you — from
            fair pricing to secure transfers, verified identities, and encrypted
            data.
          </p>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {policies.map((policy) => (
              <div
                key={policy.title}
                className="rounded-2xl border border-border bg-surface/60 p-8 sm:p-10"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-void/60">
                    <policy.icon className="h-7 w-7 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-cream">
                      {policy.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-cream/60">
                      {policy.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {policy.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-lg border border-gold/20 bg-gold/5 px-3 py-1.5 text-xs font-medium text-gold"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-surface/60 p-12 text-center sm:p-16">
            <h2 className="font-serif text-3xl font-bold text-gold sm:text-4xl">
              Something doesn&apos;t feel right?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/80">
              If you encounter any suspicious activity, fraudulent listings, or
              safety concerns, please reach out immediately. We take every report
              seriously.
            </p>
            <a
              href="/contact"
              className="mt-8 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-8 py-3.5 text-sm font-bold text-void transition hover:bg-gold-light"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

