"use client";

import { Search } from "lucide-react";
import UserMenu from "./UserMenu";
import { LogoIcon } from "./Logo";

interface ExploreHeaderProps {
  totalEvents: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  categories: string[];
}

export default function ExploreHeader({
  totalEvents,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: ExploreHeaderProps) {
  return (
    <header className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <LogoIcon className="h-10 w-auto text-gold" />
            <span className="text-3xl font-serif italic tracking-[0.1em] text-cream">On The List</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-cream sm:text-4xl">Explore Events</h1>
          <p className="mt-2 max-w-xl text-sm text-cream/60">
            Browse all upcoming events with live booking-fee trends. Green means demand is rising, red means it&apos;s cooling down.
          </p>
        </div>
        <div className="flex items-start gap-4">
          <UserMenu />
          <div className="shrink-0 rounded-xl border border-border bg-void/60 px-4 py-2.5">
            <p className="font-mono text-2xl font-bold text-gold">{totalEvents}</p>
            <p className="text-xs text-cream/60">live events</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/60" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-border bg-void/60 py-2.5 pl-10 pr-4 text-sm text-cream/90 outline-none transition placeholder:text-cream/60 focus:border-gold/60 focus:ring-2 focus:ring-gold/30" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onCategoryChange("all")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${selectedCategory === "all" ? "border border-gold/40 bg-gold/20 text-gold" : "border border-transparent text-cream/60 hover:bg-white/5 hover:text-cream/90"}`}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => onCategoryChange(cat)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${selectedCategory === cat ? "border border-gold/40 bg-gold/20 text-gold" : "border border-transparent text-cream/60 hover:bg-white/5 hover:text-cream/90"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
