"use client";

import Link from "next/link";
import { ORGANISER_DASHBOARD_URL } from "@/lib/organiserDashboard";

export default function AnnouncementBar() {
  return (
    <div className="fixed top-0 right-0 left-0 z-[60] flex h-9 items-center justify-between border-b border-[#1A1A1A] bg-[#111111] px-6 sm:px-12">
      <span className="hidden text-xs text-[#888888] sm:inline">
        Running student events in London?
      </span>
      <span className="text-xs text-cream sm:ml-auto">
        Are you an organiser?{" "}
        <a
          href={ORGANISER_DASHBOARD_URL}
          className="text-gold transition-opacity hover:opacity-70"
        >
          List your event here.
        </a>
      </span>
    </div>
  );
}
