"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, ChevronDown } from "lucide-react";

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
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:from-purple-500 hover:to-blue-500"
        >
          Sign Up
        </Link>
      </div>
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
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-blue-500 text-xs font-bold text-white">
          {initials}
        </div>
        <span className="max-w-[100px] truncate text-sm font-medium text-zinc-200">
          {user.name}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-red-400"
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
