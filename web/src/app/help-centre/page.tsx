"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const faqs = [
  {
    question: "How do I buy tickets?",
    answer:
      "Browse events on our platform, select the event you want to attend, choose your ticket quantity, and proceed to checkout. Payments are processed securely through Stripe. Once your payment is confirmed, a unique QR code is generated and linked to your account — that's your ticket.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Refund policies are set by individual event organisers. If the organiser allows refunds, you can request one from your tickets page. Alternatively, you can list your ticket for resale on the platform — you'll receive your original purchase price back when it sells.",
  },
  {
    question: "How does resale work?",
    answer:
      "If you can no longer attend an event, you can list your ticket for resale at or below the current release price. When another student buys it, your original QR code is instantly invalidated and a new one is generated for the buyer. You receive your original purchase price back in full.",
  },
  {
    question: "What is the Smart Timing Fee?",
    answer:
      "The Smart Timing Fee is our platform booking fee applied at checkout. It currently operates as a fixed percentage but is designed to adjust dynamically based on demand and proximity to the event — starting low when tickets first go on sale and rising as the event approaches. This encourages early purchases and keeps pricing fair.",
  },
  {
    question: "How do I list my ticket for resale?",
    answer:
      "Go to your tickets page, find the ticket you want to sell, and tap 'List for Resale'. Set your price (at or below the current release price) and confirm. Your ticket will appear in the resale marketplace. You can cancel the listing at any time before it sells.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Absolutely. All payments are handled by Stripe, the industry-leading payment processor. Your card details never touch our servers. Stripe is PCI DSS Level 1 compliant — the highest level of security certification available in the payments industry.",
  },
  {
    question: "What happens if an event is cancelled?",
    answer:
      "If an event is cancelled by the organiser, all ticket holders are eligible for a full refund. The organiser will initiate refunds through the platform, and funds will be returned to your original payment method. You'll receive an email notification when the refund is processed.",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach our support team by visiting the Contact page and submitting a message. We aim to respond to all enquiries within 24–48 hours. For urgent issues, email us directly at support@onthelist.com.",
  },
];

export default function HelpCentrePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-void text-cream/90">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-cream/50">
            • We&apos;re Here to Help
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl">
            Help <span className="text-gold">Centre</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            Find answers to the most common questions about buying, selling, and
            attending events on our platform.
          </p>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-surface/60 transition-colors"
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 text-sm font-semibold text-cream sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gold transition-transform duration-200 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="border-t border-border/50 px-6 pb-6 pt-4">
                    <p className="text-sm leading-relaxed text-cream/60">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-surface/60 p-12 text-center sm:p-16">
            <h2 className="font-serif text-3xl font-bold text-gold sm:text-4xl">
              Still have questions?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/80">
              Can&apos;t find what you&apos;re looking for? Our support team is
              ready to help.
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

