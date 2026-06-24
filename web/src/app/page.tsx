"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPublicClient } from "@/lib/api";
import type { EventResponse } from "@/lib/shared";
import Header, { SITE_HEADER_OFFSET } from "@/components/Header";
import Footer from "@/components/Footer";
import ExploreEventCard from "@/components/ExploreEventCard";
import SoundFamiliar from "@/components/SoundFamiliar";
import { isEventStartDateTodayOrFuture } from "@/lib/formatEventDates";

export default function HomePage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const client = createPublicClient();
    client
      .getPublishedEvents()
      .then((res) => {
        if (res.ok && res.data) setEvents(res.data);
      })
      .finally(() => setLoading(false));
    setTimeout(() => setVisible(true), 10);
  }, []);

  const featuredEvents = events
    .filter((e) => isEventStartDateTodayOrFuture(e.eventDate))
    .slice(0, 3);

  return (
    <div
      className={`min-h-screen bg-void text-cream page-enter ${SITE_HEADER_OFFSET}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "400ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <Header />

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-0 text-center sm:px-12">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/hero-bg.png)",
            backgroundPosition: "center 30%",
          }}
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.62) 0%, rgba(10,10,10,0.45) 50%, rgba(10,10,10,0.70) 100%)",
          }}
        />
        {[0, 3, 6, 9, 12, 15, 18, 21].map((delay, i) => (
          <div
            key={i}
            className="pointer-events-none absolute right-0 left-0 h-px bg-[rgba(201,168,76,0.03)]"
            style={{
              top: `${10 + i * 12}%`,
              animationName: "driftUp",
              animationDuration: "25s",
              animationDelay: `-${delay}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          />
        ))}

        <div className="relative z-[2] max-w-[860px]">
          <div className="font-display text-[clamp(56px,8vw,88px)] leading-[1.05] font-black tracking-[-0.02em] text-cream uppercase">
            BUY EARLY.
          </div>
          <div className="font-display mb-6 text-[clamp(56px,8vw,88px)] leading-[1.05] font-black tracking-[-0.02em] text-gold uppercase">
            UN-BUY LATER.
          </div>
          <p className="font-cormorant mx-auto mb-10 max-w-[560px] text-xl leading-relaxed font-light text-[#888888] italic">
            The student ticket platform that moves with your plans.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/events" className="hero-btn-primary">
              Browse Events
            </Link>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hero-btn-ghost"
            >
              How it works
            </button>
          </div>
          <div className="mt-16 flex justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#333333"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ animation: "bounce 2s ease-in-out infinite" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </section>

      <SoundFamiliar />

      <section
        id="how-it-works"
        className="relative w-full bg-void px-[6%] py-20"
        style={{
          backgroundImage: "url(/hero-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 z-[1] bg-[rgba(10,10,10,0.82)]" />
        <div className="relative z-[2] mx-auto max-w-[1200px]">
          <div className="mb-[60px] w-full">
            <div className="text-[clamp(40px,6vw,72px)] leading-none font-black text-cream uppercase">
              THREE STEPS.
            </div>
            <div className="text-[clamp(40px,6vw,72px)] leading-none font-black text-gold uppercase">
              NO SURPRISES.
            </div>
          </div>
          {[
            { n: "01", title: "BUY AT THE PRICE SHOWN." },
            {
              n: "02",
              title: "LIST THE TICKET FOR RESALE IF YOU CAN'T GO.",
            },
            { n: "03", title: "THE BUYER GETS A FRESH QR INSTANTLY." },
          ].map((step, i) => (
            <div key={step.n} className="w-full">
              {i > 0 && (
                <div className="w-full border-t border-border" />
              )}
              <div className="flex w-full items-center justify-between py-8">
                <h3 className="m-0 text-[clamp(16px,1.8vw,20px)] font-semibold text-cream">
                  {step.title}
                </h3>
                <span className="font-display shrink-0 text-right text-[clamp(64px,8vw,100px)] leading-none font-bold text-[rgba(201,168,76,0.25)]">
                  {step.n}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 py-20 pb-[100px] sm:px-12">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-[32px] font-black text-cream uppercase">
            ON NOW IN LONDON
          </h2>
          <Link
            href="/events"
            className="text-sm text-gold transition-opacity hover:opacity-70"
          >
            View all →
          </Link>
        </div>
        <p className="mt-0 mb-10 text-sm text-[#888888]">
          Student events with safe resale built in from day one.
        </p>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="now-grid">
            {featuredEvents.map((event) => (
              <ExploreEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-[#141414] p-12 text-center">
            <p className="text-cream/70">
              Nothing featured yet — new events go live here as soon as they
              publish.
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-medium text-gold hover:opacity-70"
            >
              Browse all events
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
