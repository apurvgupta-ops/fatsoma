"use client";

import Image from "next/image";
import Link from "next/link";
import type { EventResponse } from "@/lib/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export function PanelShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative z-[1] w-full px-10 py-9 ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-3">
      <div className="h-px w-6 bg-gold" />
      <span className="font-sans text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">
        {children}
      </span>
    </div>
  );
}

export function PanelTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-9 flex items-start justify-between gap-4">
      <div>
        <h1 className="m-0 font-sans text-[28px] font-bold text-cream">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 mb-0 font-sans text-[13px] text-[#888888]">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatGrid({
  stats,
  columns = 4,
}: {
  stats: { label: string; value: string }[];
  columns?: 4 | 7;
}) {
  return (
    <div
      className={`otl-stat-grid mb-12 grid overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.02] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] ${
        columns === 7 ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" : "grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="otl-stat-cell group relative overflow-hidden border-white/[0.06] bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] px-[22px] py-6 backdrop-blur-md not-last:border-r"
        >
          <div className="otl-stat-shimmer pointer-events-none absolute top-0 left-0 h-full w-[40%] -translate-x-full bg-[linear-gradient(105deg,transparent_40%,rgba(201,168,76,0.13)_50%,transparent_60%)]" />
          <div className="relative font-sans text-[10px] font-semibold tracking-[0.14em] text-[#888888] uppercase">
            {stat.label}
          </div>
          <div className="relative mt-3.5 font-sans text-[26px] font-bold text-gold">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GoldButton({
  children,
  onClick,
  href,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const className =
    "inline-flex items-center justify-center border-none bg-gold px-[22px] py-2.5 font-sans text-[13px] font-semibold text-void transition-colors hover:bg-[#D4B862] disabled:cursor-not-allowed disabled:opacity-50";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "inline-flex items-center justify-center border border-[#222222] bg-transparent px-4 py-2 font-sans text-[13px] text-[#888888] transition-colors hover:border-[#888888] hover:text-cream";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex w-fit items-center gap-1.5 font-sans text-[13px] text-[#888888] no-underline transition-colors hover:text-cream"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      {children}
    </Link>
  );
}

const STATUS_LABELS: Record<string, string> = {
  published: "UPCOMING",
  draft: "DRAFT",
};

const STATUS_COLORS: Record<string, string> = {
  published: "#C9A84C",
  draft: "#555555",
};

export function getEventImageUrl(event: EventResponse) {
  const isPlaceholder = event.eventImage.startsWith("placeholder-");
  if (isPlaceholder) {
    return `https://placehold.co/400x300/1a1a1a/9333ea.png?text=${encodeURIComponent(event.eventName)}`;
  }
  if (event.eventImage.startsWith("/uploads/")) {
    return `${API_URL}${event.eventImage}`;
  }
  return event.eventImage;
}

export function formatEventDate(event: EventResponse) {
  return new Date(event.eventDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EventPreviewCard({
  event,
  href,
}: {
  event: EventResponse;
  href: string;
}) {
  const status = event.status;
  const statusColor = STATUS_COLORS[status] ?? "#888888";
  const statusLabel = STATUS_LABELS[status] ?? status.toUpperCase();
  const totalTickets = event.ticketBatches.reduce((sum, b) => sum + b.quantity, 0);
  const fromPrice =
    event.ticketBatches.length > 0
      ? Math.min(...event.ticketBatches.map((b) => b.basePrice))
      : 0;
  const isGold = statusColor === "#C9A84C";

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-lg border border-[#222222] bg-[#141414] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[rgba(201,168,76,0.45)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.5)]"
    >
      <div className="relative h-[140px] bg-[#1A1A1A]">
        <Image
          src={getEventImageUrl(event)}
          alt={event.eventName}
          fill
          className="object-cover"
          unoptimized
        />
        <span
          className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.08em]"
          style={{
            background: isGold ? "#C9A84C" : "rgba(10,10,10,0.78)",
            color: isGold ? "#0A0A0A" : statusColor,
            border: isGold ? "none" : `1px solid ${statusColor}55`,
          }}
        >
          {statusLabel}
        </span>
      </div>
      <div className="px-4 py-3.5">
        <div className="line-clamp-2 font-sans text-sm leading-snug font-bold text-cream">
          {event.eventName}
        </div>
        <div className="mt-1 font-sans text-[11px] text-[#888888]">
          {event.venueName} · {formatEventDate(event)}
        </div>
        <div className="mt-0.5 font-sans text-[11px] text-[#555555]">
          {totalTickets.toLocaleString()} tickets · From £{fromPrice.toFixed(2)}
        </div>
      </div>
    </Link>
  );
}

export function OtlSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-[340px]">
      <svg
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#888888"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="otl-input w-full border-none bg-transparent py-2.5 pr-3 pl-9 font-sans text-[13px] text-cream outline-none placeholder:text-[#555555]"
      />
    </div>
  );
}
