"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const PHASE_DURATIONS = [700, 1300, 1000, 1000, 1500, 1000];

export default function EmptyTicketsAnimation() {
  const [animPhase, setAnimPhase] = useState(0);
  const [amountSubVisible, setAmountSubVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function advance(phase: number) {
      timerRef.current = setTimeout(() => {
        const next = (phase + 1) % 6;
        setAnimPhase(next);
        if (next === 4) setTimeout(() => setAmountSubVisible(true), 300);
        if (next === 0) setAmountSubVisible(false);
        advance(next);
      }, PHASE_DURATIONS[phase]);
    }
    advance(0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const ticketFade = animPhase === 0 ? 1 : animPhase <= 2 ? 1 : 0;
  const ticketSlide = animPhase === 3 ? -20 : 0;
  const ticketStatus = animPhase >= 2 ? "LISTED" : "VALID";
  const statusColor = animPhase >= 2 ? "#C9A84C" : "#4CAF74";

  const showBubble = animPhase >= 1 && animPhase <= 3;
  const bubbleFade = animPhase === 1 || animPhase === 2 ? 1 : 0;

  const showAmount = animPhase >= 4;
  const amountFade = animPhase >= 4 ? 1 : 0;

  return (
    <div className="mx-auto max-w-[480px]">
      <div className="relative mb-12 flex h-[280px] items-center justify-center">
        {animPhase <= 3 && (
          <div
            className="absolute transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              opacity: ticketFade,
              transform: `translateY(${ticketSlide}px)`,
            }}
          >
            <AnimTicket status={ticketStatus} statusColor={statusColor} />
          </div>
        )}

        {showBubble && (
          <div
            className="absolute right-0 bottom-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              opacity: bubbleFade,
              transform: `translateX(${bubbleFade ? 0 : 40}px)`,
            }}
          >
            <div className="rounded-xl border border-[#333333] bg-[#1A1A1A] px-3.5 py-2.5">
              <p className="m-0 text-[13px] text-cream">
                📚 Essay due tomorrow.
              </p>
            </div>
          </div>
        )}

        {showAmount && (
          <div
            className="absolute text-center transition-opacity duration-500"
            style={{
              opacity: amountFade,
              animation: amountFade
                ? "unbuyAmountIn 400ms cubic-bezier(0.16,1,0.3,1)"
                : "none",
            }}
          >
            <span className="font-display block text-[72px] leading-none font-bold text-gold">
              £15
            </span>
            {amountSubVisible && (
              <span className="font-cormorant mt-2 block text-[22px] text-[#888888] italic animate-[fadeInUp_300ms_cubic-bezier(0.16,1,0.3,1)]">
                Back in your pocket.
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-[60px] flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-1.5 rounded-[3px] bg-[rgba(201,168,76,0.2)] transition-all duration-300"
            style={{
              width: i === animPhase ? "20px" : "6px",
              background: i === animPhase ? "#C9A84C" : "rgba(201,168,76,0.2)",
            }}
          />
        ))}
      </div>

      <div className="mb-20 text-center">
        <Link
          href="/events"
          className="font-jost text-[13px] tracking-[0.1em] text-gold uppercase transition-opacity hover:opacity-70"
        >
          Browse events and buy safely →
        </Link>
      </div>
    </div>
  );
}

function AnimTicket({
  status,
  statusColor,
}: {
  status: string;
  statusColor: string;
}) {
  return (
    <div className="w-[300px] rounded-xl border border-border bg-[#1A1A1A] p-5">
      <h3 className="font-display m-0 mb-1 text-base font-bold text-cream">
        Velvet Underground Closing Party
      </h3>
      <p className="m-0 text-[13px] text-[#888888]">
        Fabric, London · Sat 28 Jun
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[13px] text-[#888888]">
          £<span className="font-bold text-gold">15</span> paid
        </span>
        <span
          className="font-jost rounded px-2 py-1 text-[11px] tracking-[0.08em] uppercase transition-all duration-300"
          style={{
            background:
              status === "LISTED"
                ? "rgba(201,168,76,0.12)"
                : "rgba(76,175,116,0.12)",
            border: `1px solid ${statusColor}33`,
            color: statusColor,
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
