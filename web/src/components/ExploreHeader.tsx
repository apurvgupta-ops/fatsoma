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
          <h1 className="mt-6 text-5xl font-serif font-light tracking-wide text-cream/90 sm:text-6xl">Explore Events</h1>
          <p className="mt-4 max-w-xl text-sm font-mono tracking-widest text-[10px] uppercase text-cream/40">
            Browse upcoming events • Live booking-fee trends
          </p>
        </div>
        <div className="flex items-start gap-4">
          <UserMenu />
          <div className="shrink-0 border-l border-border/50 pl-6 flex flex-col items-end">
            <p className="font-serif text-3xl italic text-gold">{totalEvents}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-cream/40 mt-1">live events</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/60" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-none border-b border-border/50 bg-transparent py-4 pl-10 pr-4 text-sm text-cream/90 outline-none transition placeholder:text-cream/40 focus:border-gold focus:ring-0" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onCategoryChange("all")}
            className={`pb-2 text-xs font-medium uppercase tracking-widest transition-all ${selectedCategory === "all" ? "border-b border-gold text-gold" : "border-b border-transparent text-cream/40 hover:text-cream/80"}`}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => onCategoryChange(cat)}
              className={`pb-2 text-xs font-medium uppercase tracking-widest transition-all ${selectedCategory === cat ? "border-b border-gold text-gold" : "border-b border-transparent text-cream/40 hover:text-cream/80"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

