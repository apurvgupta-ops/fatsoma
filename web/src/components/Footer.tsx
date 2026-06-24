"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function ColLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-3 block text-sm text-[#888888] transition-colors hover:text-cream"
    >
      {children}
    </Link>
  );
}

function SocialButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-transparent text-[#888888] transition hover:border-gold/35 hover:shadow-[0_0_10px_rgba(201,168,76,0.25)]"
    >
      {children}
    </button>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <footer className="relative z-[2] bg-void">
      {isHome && (
        <div className="mx-6 my-[60px] sm:mx-12">
          <div className="rounded-2xl border border-border bg-[#141414] px-6 py-16 text-center sm:px-12 sm:py-20">
            <h2 className="font-jost text-[clamp(44px,6vw,80px)] leading-[1.05] font-black text-gold uppercase">
              CAN&apos;T MAKE IT?
              <br />
              SOMEONE ELSE CAN.
            </h2>
            <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-[#888888]">
              Pass your spot on the list. You get your ticket&apos;s money back.
              <br />
              They get a real ticket.
            </p>
            <div className="mt-10 flex justify-center">
              <Link href="/unbuy" className="hero-btn-primary px-9 py-4">
                LIST FOR RESALE
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-12 border-t border-border px-[6%] py-16">
        <div className="min-w-[220px] max-w-[280px]">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-base font-bold text-gold">✓</span>
            <span className="font-serif text-lg font-bold text-cream">
              On The List
            </span>
          </Link>
          <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-[#888888]">
            The student ticket platform that moves with your plans.
          </p>
          <div className="mt-6 flex gap-2.5">
            <SocialButton label="Instagram">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </SocialButton>
            <SocialButton label="TikTok">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </SocialButton>
            <SocialButton label="Facebook">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </SocialButton>
            <SocialButton label="Twitter">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </SocialButton>
          </div>
        </div>

        <div>
          <span className="font-jost mb-5 block text-[11px] font-semibold tracking-[0.1em] text-gold uppercase">
            Platform
          </span>
          <ColLink href="/events">Events</ColLink>
          <ColLink href="/dashboard">My Tickets</ColLink>
        </div>

        <div>
          <span className="font-jost mb-5 block text-[11px] font-semibold tracking-[0.1em] text-gold uppercase">
            Company
          </span>
          <ColLink href="/about">About</ColLink>
          <ColLink href="/contact">Contact</ColLink>
        </div>

        <div>
          <span className="font-jost mb-5 block text-[11px] font-semibold tracking-[0.1em] text-gold uppercase">
            Legal
          </span>
          <ColLink href="/terms">Terms</ColLink>
          <ColLink href="/privacy">Privacy</ColLink>
          <ColLink href="/refunds">Refunds</ColLink>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-[6%] py-5">
        <p className="m-0 text-xs text-[#555555]">
          © {new Date().getFullYear()} On The List. All rights reserved.
        </p>
        <p className="font-jost m-0 text-[11px] font-semibold tracking-[0.12em] text-[#555555] uppercase">
          Made for Students · Powered by the Night
        </p>
      </div>
    </footer>
  );
}
