"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sections = [
  {
    number: 1,
    title: "Acceptance of Terms",
    content:
      'By accessing or using On The List ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use the Platform. We reserve the right to update these terms at any time, and your continued use of the Platform constitutes acceptance of any modifications.',
  },
  {
    number: 2,
    title: "User Accounts",
    content:
      "You must create an account to purchase or sell tickets on the Platform. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate and complete information during registration and keep your account information up to date. We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.",
  },
  {
    number: 3,
    title: "Ticket Purchases",
    content:
      "All ticket purchases are subject to availability. Prices are set by event organisers and may vary between ticket batches. A platform booking fee is applied at checkout. Once a purchase is confirmed, a unique QR code is generated and linked to your account. This QR code serves as your entry credential and must not be shared, duplicated, or transferred outside of the Platform's official resale mechanism.",
  },
  {
    number: 4,
    title: "Resale Policy",
    content:
      "Tickets may be listed for resale exclusively through the Platform's built-in resale feature. Resale prices are capped at the current release price set by the organiser — tickets may not be listed above this threshold. When a resale transaction is completed, the seller's QR code is immediately invalidated and a new QR code is generated for the buyer. Resale listings close one hour before the event start time. Any attempt to sell tickets outside of the Platform, or at prices above the cap, will result in account suspension.",
  },
  {
    number: 5,
    title: "Fees and Payments",
    content:
      "All payments are processed through PayPal, a PCI DSS Level 1 compliant payment processor. A booking fee is applied to all ticket purchases and resale transactions. The current fee structure is displayed at checkout before payment is confirmed. Sellers receive their original purchase price when a resale is completed. The Platform does not store payment card details — all sensitive payment information is handled by PayPal.",
  },
  {
    number: 6,
    title: "Cancellations and Refunds",
    content:
      "Refund policies are determined by individual event organisers. If an event is cancelled, all ticket holders are eligible for a full refund, which will be processed to the original payment method. If an organiser permits refunds for non-cancelled events, refund requests must be submitted through the Platform. The Platform booking fee may or may not be refundable depending on the circumstances. We recommend listing your ticket for resale as an alternative to requesting a refund.",
  },
  {
    number: 7,
    title: "Limitation of Liability",
    content:
      'The Platform acts as an intermediary between event organisers and ticket buyers. We do not organise, host, or manage events listed on the Platform. To the maximum extent permitted by law, On The List shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform, including but not limited to event cancellations, changes to event details, or any disputes between buyers and sellers. The Platform is provided "as is" without warranties of any kind.',
  },
  {
    number: 8,
    title: "Privacy",
    content:
      "We collect and process personal data in accordance with applicable data protection laws, including the UK GDPR. Personal information is used solely for the purpose of providing and improving our services. We do not sell or share your personal data with third parties for marketing purposes. All data is encrypted in transit and at rest. For full details on how we handle your data, please refer to our Privacy Policy.",
  },
  {
    number: 9,
    title: "Changes to Terms",
    content:
      "We reserve the right to modify these Terms and Conditions at any time. Material changes will be communicated via email or through a notice on the Platform. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised terms. We encourage you to review these terms periodically to stay informed of any updates.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-void text-cream/90">
      <Header />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gold/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-light/15 blur-[160px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-cream/50">
            • Legal
          </p>
          <h1 className="font-serif text-5xl font-bold tracking-tight text-cream sm:text-6xl">
            Terms & <span className="text-gold">Conditions</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            Please read these terms carefully before using the On The List
            platform.
          </p>
          <p className="mt-4 text-xs text-cream/40">
            Last updated: March 2026
          </p>
        </div>
      </section>

      <section className="relative border-t border-border/50">
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-gold/10 blur-[160px]" />
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.number}>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm font-semibold text-gold">
                    {section.number}.
                  </span>
                  <h2 className="font-serif text-xl font-bold text-cream sm:text-2xl">
                    {section.title}
                  </h2>
                </div>
                <p className="mt-4 pl-7 text-sm leading-relaxed text-cream/60">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-border bg-surface/60 p-8 text-center sm:p-10">
            <p className="text-sm text-cream/60">
              If you have any questions about these terms, please{" "}
              <a
                href="/contact"
                className="font-medium text-gold hover:underline"
              >
                contact us
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


