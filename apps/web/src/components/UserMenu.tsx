"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, ChevronDown, Ticket } from "lucide-react";

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
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-white/5" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-void transition hover:brightness-110"
      >
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light text-xs font-bold text-cream">
          {initials}
        </div>
        <span className="max-w-[100px] truncate text-sm font-medium text-cream/90">
          {user.name}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-cream/60 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-void shadow-2xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-cream">{user.name}</p>
            <p className="truncate text-xs text-cream/60">{user.email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/tickets"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-cream/60 transition hover:bg-white/5 hover:text-gold"
            >
              <Ticket className="h-4 w-4" />
              My Tickets
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-cream/60 transition hover:bg-white/5 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
