"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-[#2A2A2A]" />
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="nav-sign-up">
        Sign In
      </Link>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const menuItemClass =
    "block w-full border-b border-border px-4 py-3 text-left font-jost text-xs tracking-[0.08em] text-cream/70 uppercase transition hover:bg-[#242424] last:border-b-0";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[#2A2A2A] font-jost text-xs font-bold tracking-[0.05em] text-gold"
        aria-label="Profile menu"
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute top-11 right-0 z-[100] min-w-[160px] overflow-hidden rounded-lg border border-border bg-[#1A1A1A] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          style={{ animation: "fadeInDown 150ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          <Link
            href="/unbuy"
            onClick={() => setOpen(false)}
            className={menuItemClass}
          >
            My Tickets
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className={menuItemClass}
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={menuItemClass}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
