"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { organiserPaths } from "@/lib/organiserPaths";

const ORGANIZER_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: organiserPaths.dashboard, icon: "grid" },
  { id: "events", label: "Events", href: organiserPaths.events, icon: "calendar" },
  { id: "payments", label: "Payments", href: organiserPaths.payments, icon: "card" },
  {
    id: "withdrawals",
    label: "Withdrawals",
    href: organiserPaths.withdrawals,
    icon: "wallet",
    organizerOnly: true,
  },
  { id: "staff", label: "Staff", href: organiserPaths.staff, icon: "person" },
];

const ADMIN_NAV: NavItem[] = [
  { id: "organisers", label: "Organisers", href: organiserPaths.users, icon: "users" },
  {
    id: "withdraw-requests",
    label: "Withdraw Requests",
    href: organiserPaths.withdrawRequests,
    icon: "wallet",
  },
];

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  organizerOnly?: boolean;
};

function NavIcon({ type, color }: { type: string; color: string }) {
  const props = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "grid") {
    return (
      <svg {...props}>
        <polyline points="3 3 9 3 9 9 3 9 3 3" />
        <polyline points="15 3 21 3 21 9 15 9 15 3" />
        <polyline points="3 15 9 15 9 21 3 21 3 15" />
        <polyline points="15 15 21 15 21 21 15 21 15 15" />
      </svg>
    );
  }
  if (type === "calendar") {
    return (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }
  if (type === "card") {
    return (
      <svg {...props}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    );
  }
  if (type === "users") {
    return (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (type === "wallet") {
    return (
      <svg {...props}>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href === organiserPaths.dashboard) {
    return pathname === organiserPaths.dashboard;
  }
  return pathname.startsWith(href);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavActive(pathname, item.href);
  const iconColor = active ? "#C9A84C" : "#888888";

  return (
    <Link
      href={item.href}
      className={`flex w-full items-center gap-2.5 px-5 py-2.5 font-sans text-[13px] no-underline transition-colors ${
        active
          ? "bg-[rgba(201,168,76,0.07)] text-cream shadow-[inset_2px_0_0_#C9A84C]"
          : "text-[#888888] hover:bg-white/[0.03] hover:text-cream"
      }`}
    >
      <NavIcon type={item.icon} color={iconColor} />
      {item.label}
      {active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
      )}
    </Link>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-5 pt-4 pb-1.5 font-sans text-[10px] font-semibold tracking-[0.12em] text-[#444444] uppercase">
      {label}
    </div>
  );
}

export default function OrganiserShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const isOrganizer = user?.role === "organizer";

  const visibleOrganizerNav = ORGANIZER_NAV.filter(
    (item) => !item.organizerOnly || isOrganizer,
  );

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OR";

  const roleLabel =
    user?.role === "admin"
      ? "ADMIN"
      : user?.role === "staff"
        ? "STAFF"
        : "ORGANISER";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_60%_55%_at_85%_80%,rgba(201,168,76,0.08)_0%,rgba(10,10,10,0)_70%),#0A0A0A]">
      <aside className="flex h-screen w-[230px] min-w-[230px] flex-col overflow-hidden bg-[#0D0D0D]">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="font-serif text-[15px] font-bold text-cream">
              On The List
            </span>
          </div>
          <div className="mt-1.5 font-sans text-[10px] font-medium tracking-[0.1em] text-[#444444] uppercase">
            {isAdmin ? "Admin Panel" : "Organiser Panel"}
          </div>
        </div>

        <div className="border-t border-[#1A1A1A]" />

        <nav className="flex-1 overflow-y-auto py-3">
          {isAdmin && <NavSection label="Organiser" />}
          {visibleOrganizerNav.map((item) => (
            <NavLink key={item.id} item={item} pathname={pathname} />
          ))}

          {isAdmin && (
            <>
              <NavSection label="Admin" />
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.id} item={item} pathname={pathname} />
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-[#1A1A1A]" />

        <div className="p-3">
          <div className="rounded-lg border border-[#1E1E1E] bg-[#111111] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1E1E1E] font-sans text-[11px] font-bold text-gold">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate font-sans text-[13px] font-medium text-cream">
                  {user?.name ?? "Organiser"}
                </div>
                <div className="truncate font-sans text-[11px] text-[#888888]">
                  {user?.email ?? ""}
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <span className="inline-flex rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2.5 py-0.5 font-sans text-[10px] tracking-[0.1em] text-gold">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1A1A1A] px-5 py-3">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 border-none bg-transparent p-0 font-sans text-xs text-[#888888] transition-colors hover:text-cream"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="relative flex h-screen flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none fixed top-0 right-0 z-0 h-[45vh] w-[55vw] bg-[radial-gradient(ellipse_at_90%_10%,rgba(201,168,76,0.055)_0%,rgba(10,10,10,0)_65%)]" />
        {children}
      </div>
    </div>
  );
}
