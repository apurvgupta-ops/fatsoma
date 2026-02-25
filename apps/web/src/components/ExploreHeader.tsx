"use client";

import { Search, Sparkles } from "lucide-react";
import UserMenu from "./UserMenu";

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Fatsoma</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Explore Events</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Browse all upcoming events with live booking-fee trends. Green means demand is rising, red means it&apos;s cooling down.
          </p>
        </div>
        <div className="flex items-start gap-4">
          <UserMenu />
          <div className="shrink-0 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2.5">
            <p className="font-mono text-2xl font-bold text-purple-300">{totalEvents}</p>
            <p className="text-xs text-zinc-500">live events</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-white/10 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onCategoryChange("all")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${selectedCategory === "all" ? "border border-purple-500/40 bg-purple-500/20 text-purple-300" : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}>
            All
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => onCategoryChange(cat)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${selectedCategory === cat ? "border border-purple-500/40 bg-purple-500/20 text-purple-300" : "border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
