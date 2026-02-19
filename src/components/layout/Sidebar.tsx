"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: "admin" | "user";
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Events",
      href: "/events",
      icon: Calendar,
    },
    ...(user.role === "admin"
      ? [
          {
            name: "Users",
            href: "/admin/users",
            icon: Users,
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-zinc-950/95 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-blue-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Fatsoma</h2>
            <p className="text-xs text-zinc-500">Event Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-purple-500/10 text-purple-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active
                      ? "text-purple-400"
                      : "text-zinc-500 group-hover:text-zinc-400"
                  }`}
                />
                {item.name}
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-lg bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
              {user.role === "admin" && (
                <span className="ml-2 shrink-0 rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
                  Admin
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
