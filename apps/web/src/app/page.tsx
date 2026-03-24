"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createPublicClient } from "@/lib/api";
import type { EventResponse } from "@fatsoma/shared";
import {
  ChevronDown,
  Ticket,
  QrCode,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
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
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-cream/50">
            • Secure Student Ticket Platform
          </p>
          <h1 className="font-serif text-5xl  tracking-tight text-cream sm:text-6xl lg:text-7xl font-extrabold">
            You&apos;re on<span className="text-gold"> the list</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            The only student ticket platform with secure, no-scalping resale.
            You always pay the current release price — never a penny more. Just
            the events you want, transferred safely.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-8 py-3.5 text-sm font-bold text-void transition hover:bg-gold-light"
            >
              <ShoppingCart className="h-4 w-4" />
              Browse Events
            </Link>
            <Link
              href="/tickets"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gold px-8 py-3.5 text-sm font-bold text-gold transition hover:bg-gold/10"
            >
              <Ticket className="h-4 w-4" />
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
      <section className="relative border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-surface/60 p-12 text-center sm:p-16">
            <h2 className="font-serif text-3xl font-bold text-gold sm:text-4xl">
              Got a ticket you can&apos;t use?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/80">
              List your ticket and let another student take your spot. They pay
              the current release price — you get your original money back.
              Secure, fair, instant.
            </p>
            <Link
              href="/tickets"
              className="mt-8 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-8 py-3.5 text-sm font-bold text-void transition hover:bg-gold-light"
            >
              List a Ticket
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
