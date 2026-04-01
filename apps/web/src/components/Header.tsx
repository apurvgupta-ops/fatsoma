"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Bell, Menu } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const isActive =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          isActive ? "text-gold" : "text-muted hover:text-cream"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <Check className="h-5 w-5 text-gold" />
          <span className="font-serif text-xl font-semibold tracking-tight text-cream transition-colors group-hover:text-gold">
            On The List
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLink("/", "Home")}
          {navLink("/events", "Events")}
          {navLink("/tickets", "My Tickets")}

          <div className="relative">
            <button
              type="button"
              className="relative p-1 text-muted transition-colors hover:text-cream"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>

          <UserMenu />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <div className="relative">
            <button
              type="button"
              className="p-2 text-muted transition-colors hover:text-cream"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            className="p-2 text-muted transition-colors hover:text-cream"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
