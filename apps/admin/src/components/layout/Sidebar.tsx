"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { LogoIcon } from "../Logo";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Panel", href: "/panel", icon: BarChart3 },
    ...(user?.role === "admin"
      ? [{ name: "Users", href: "/users", icon: Users }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-void/95 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <LogoIcon className="h-10 w-auto text-gold" />
          <div>
            <h2 className="text-xl font-serif italic tracking-[0.1em] text-cream">On The List</h2>
            <p className="text-xs text-cream/60">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-gold/10 text-gold" : "text-cream/60 hover:bg-white/5 hover:text-cream/90"
                  }`}>
                <Icon className={`h-5 w-5 transition-colors ${active ? "text-gold" : "text-cream/60 group-hover:text-cream/60"}`} />
                {item.name}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 rounded-lg bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-cream">{user?.name ?? "User"}</p>
                <p className="truncate text-xs text-cream/60">{user?.email ?? ""}</p>
              </div>
              {user?.role === "admin" && (
                <span className="ml-2 shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs text-gold">Admin</span>
              )}
            </div>
          </div>
          <button onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/60 transition-all hover:bg-rose-500/10 hover:text-rose-300">
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
