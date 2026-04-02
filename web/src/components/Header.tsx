"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Header() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const isActive =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition ${
          isActive ? "text-gold" : "text-cream/90 hover:text-gold"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Check className="h-5 w-5 text-gold" />
          <span className="text-xl font-serif font-extrabold tracking-tight text-cream">
            On The List
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {navLink("/", "Home")}
          {navLink("/events", "Events")}
          {navLink("/tickets", "My Tickets")}
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

