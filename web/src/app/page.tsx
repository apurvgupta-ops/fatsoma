"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/api";
import type { EventResponse } from "@/lib/shared";
import { ChevronDown, Ticket, QrCode, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExploreEventCard from "@/components/ExploreEventCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export default function HomePage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getPublishedEvents()
      .then((res) => {
        if (res.ok && res.data) setEvents(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const featuredEvents = events.slice(0, 3);

  return (
    <div className="min-h-screen bg-void text-cream/90">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-surface px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold"></span>
            <span className="text-muted text-xs font-medium tracking-wide uppercase">
              Secure Student Ticket Platform
            </span>
          </div>

          <h1 className="mb-6 font-serif text-5xl font-bold leading-tight text-cream sm:text-6xl lg:text-7xl">
            You&apos;re <span className="text-gold">on the list</span>
          </h1>

          <p className="text-muted mx-auto mb-10 max-w-xl text-lg leading-relaxed sm:text-xl">
            The only student ticket platform with secure, no-scalping spot
            transfers. You always pay the current release price — never a penny
            more. Just the events you want, transferred safely.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/events"
              className="rounded-lg bg-gold px-8 py-3.5 text-base font-semibold text-void transition-colors hover:bg-gold-light"
            >
              Browse Events
            </Link>
            <Link
              href="/tickets"
              className="rounded-lg border border-border px-8 py-3.5 text-base font-medium text-cream transition-all hover:border-gold/30 hover:bg-surface"
            >
              My Tickets
            </Link>
          </div>
          <div className="mt-16 flex flex-col items-center gap-1 text-xs text-cream/40">
            <button
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-16 flex cursor-pointer flex-col items-center gap-1 text-xs text-cream/40 transition hover:text-cream/60"
            >
              <span>Scroll</span>
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-serif text-4xl font-bold text-cream">
            How It Works
          </h2>
          <p className="mt-3 text-center text-sm text-cream/60">
            Secure transfers in three steps
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<Ticket className="h-8 w-8 text-gold" />}
              title="No Scalping, Ever"
              description="Resale tickets are priced at the current release tier — you never pay above what's available today. A small transfer fee covers the secure handoff."
            />
            <FeatureCard
              icon={<QrCode className="h-8 w-8 text-gold" />}
              title="Atomic QR Transfer"
              description="When a ticket sells, the old QR is instantly invalidated and a new one is generated. No duplicates, no fraud."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8 text-gold" />}
              title="Verified & Secure"
              description="Student ID verified. Resale closes 1 hour before event. Every transfer is tracked and tamper-proof."
            />
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="relative border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-4xl font-bold text-cream">
                Featured Events
              </h2>
              <p className="mt-2 text-sm text-cream/60">
                The ones everyone&apos;s talking about
              </p>
            </div>
            <Link
              href="/events"
              className="mt-4 text-sm font-medium text-gold hover:underline sm:mt-0"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="mt-12 flex min-h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {featuredEvents.map((event) => (
                <ExploreEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-xl border border-border/50 bg-surface/40 p-12 text-center">
              <p className="text-cream/70">No events yet. Check back soon!</p>
              <Link
                href="/events"
                className="mt-4 inline-block text-sm font-medium text-gold hover:underline"
              >
                Browse all events
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* List a Ticket */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-surface p-10 text-center">
          <div className="absolute inset-0 bg-linear-to-r from-gold/5 via-transparent to-gold/5" />
          <div className="relative z-10">
            <h2 className="mb-3 font-serif text-2xl font-bold text-cream sm:text-3xl">
              Got a ticket you can&apos;t use?
            </h2>
            <p className="text-muted mx-auto mb-6 max-w-md leading-relaxed">
              Pass your spot to another student. They pay the current release
              price — you get your original money back. Secure, fair, instant.
            </p>
            <Link
              href="/tickets"
              className="inline-flex rounded-lg bg-gold px-8 py-3 font-semibold text-void transition-colors hover:bg-gold-light"
            >
              Pass it on the list
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-8">
      <div className="flex justify-center">{icon}</div>
      <h3 className="mt-4 text-center text-lg font-semibold text-cream">
        {title}
      </h3>
      <p className="mt-3 text-center text-sm leading-relaxed text-cream/60">
        {description}
      </p>
    </div>
  );
}

