"use client";

import { useEffect, useState } from "react";

export default function WhatHappensSection({ price }: { price: number }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const priceStr = `£${price}`;

  const stepCard =
    "flex flex-1 flex-col items-center gap-4 rounded-[14px] border border-[#3A3020] bg-[rgba(26,26,26,0.85)] p-6 text-center shadow-[0_0_0_1px_rgba(201,168,76,0.08),0_0_24px_rgba(201,168,76,0.10),0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm";

  const arrow = (
    <div
      className={`shrink-0 text-center text-[22px] leading-none text-gold opacity-60 ${isMobile ? "rotate-90 py-2" : "px-3"}`}
    >
      →
    </div>
  );

  return (
    <section className="w-full bg-transparent px-[5%] py-12 sm:px-[6%] sm:pt-[60px] sm:pb-12">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center">
        <div className="text-center">
          <div className="font-jost mb-5 text-[11px] font-medium tracking-[0.14em] text-gold">
            HERE&apos;S EXACTLY
          </div>
          <h2 className="font-display m-0 mb-16 text-[clamp(40px,6vw,76px)] leading-[1.05] font-bold tracking-[-0.02em] text-cream uppercase">
            WHAT <span className="text-gold">HAPPENS.</span>
          </h2>
        </div>

        <div
          className={`flex w-full gap-5 ${isMobile ? "flex-col items-stretch" : "flex-row items-center"}`}
        >
          <div className={stepCard}>
            <div className="self-start font-jost text-xs tracking-[0.1em] text-gold opacity-70">
              01
            </div>
            <TicketIcon />
            <div className="font-jost text-[11px] font-semibold tracking-[0.14em] text-gold">
              YOU BUY
            </div>
            <div className="font-display text-[clamp(36px,4vw,52px)] leading-none font-bold text-gold">
              {priceStr}
            </div>
          </div>

          {arrow}

          <div className={stepCard}>
            <div className="self-start font-jost text-xs tracking-[0.1em] text-gold opacity-70">
              02
            </div>
            <CycleIcon />
            <div className="font-jost text-[11px] font-semibold tracking-[0.14em] text-gold">
              PLANS CHANGE
            </div>
            <span className="inline-flex items-center justify-center rounded-full border-[1.5px] border-gold px-5 py-2.5 font-jost text-[13px] font-semibold tracking-[0.08em] text-gold">
              LIST FOR RESALE
            </span>
          </div>

          {arrow}

          <div className={stepCard}>
            <div className="self-start font-jost text-xs tracking-[0.1em] text-gold opacity-70">
              03
            </div>
            <WalletIcon />
            <div className="font-jost text-[11px] font-semibold tracking-[0.14em] text-gold">
              YOU GET BACK
            </div>
            <div className="font-display text-[clamp(36px,4vw,52px)] leading-none font-bold text-gold">
              {priceStr}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TicketIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C9A84C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a1 1 0 0 1 0-2V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a1 1 0 0 1 0 2v2a1 1 0 0 1 0 2v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 0-2V9z" />
      <line x1="9" y1="4" x2="9" y2="20" strokeDasharray="2 2" />
    </svg>
  );
}

function CycleIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C9A84C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C9A84C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path
        d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"
        fill="#C9A84C"
        stroke="none"
      />
      <path d="M2 10V6a2 2 0 0 1 2-2h16" />
    </svg>
  );
}
