"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, X, ChevronLeft, Home } from "lucide-react";
import UserMenu from "./UserMenu";
import AnnouncementBar from "./AnnouncementBar";
import { createBrowserClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { NotificationResponse } from "@/lib/shared";

const CENTER_LINKS = [
  { href: "/events", label: "Buy" },
  { href: "/unbuy", label: "Un-buy" },
];

function CenterNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const show = active || hovered;

  return (
    <Link
      href={href}
      className="relative inline-block pb-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className={`font-jost block text-[13px] font-normal tracking-[0.15em] uppercase transition-colors duration-200 ${
          active ? "text-gold" : hovered ? "text-cream" : "text-[#888888]"
        }`}
      >
        {label}
      </span>
      <span
        className="absolute right-0 bottom-0 left-0 block h-px origin-left bg-gold transition-transform duration-200"
        style={{ transform: show ? "scaleX(1)" : "scaleX(0)" }}
      />
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const formattedNotifications = useMemo(
    () => notifications.slice(0, 8),
    [notifications],
  );

  const isActive = (href: string) => {
    if (href === "/events") {
      return pathname === "/events" || pathname.startsWith("/events/");
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    const client = createBrowserClient();

    const refreshUnread = () => {
      client
        .getUnreadNotificationsCount()
        .then((res) => {
          if (res.ok && res.data) {
            setUnreadCount(res.data.count);
          }
        })
        .catch(() => {
          // noop
        });
    };

    refreshUnread();
    const interval = window.setInterval(refreshUnread, 45000);
    return () => window.clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if ((!open && !mobileNotificationsOpen) || !user) return;

    const client = createBrowserClient();
    setLoading(true);
    client
      .getMyNotifications({ limit: 20 })
      .then((res) => {
        if (res.ok && res.data) {
          setNotifications(res.data.items);
        }
      })
      .finally(() => setLoading(false));
  }, [open, mobileNotificationsOpen, user]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileNotificationsOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen && !mobileNotificationsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileNotificationsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen, mobileNotificationsOpen]);

  useEffect(() => {
    if (!open) return;
    const onOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  const markOneRead = async (notificationId: string) => {
    const client = createBrowserClient();
    const res = await client.markNotificationRead(notificationId);
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const markAllRead = async () => {
    const client = createBrowserClient();
    const res = await client.markAllNotificationsRead();
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getNotificationTarget = (notification: NotificationResponse) => {
    const metadata = notification.metadata as Record<string, unknown> | null;
    const eventId = metadata?.eventId;

    switch (notification.type) {
      case "order_paid":
      case "resale_bought":
      case "resale_sold":
        return "/unbuy";
      case "calendar_connected":
        return "/events";
      default:
        break;
    }

    if (typeof eventId === "string" && eventId.length > 0) {
      return `/events/${eventId}`;
    }

    return "/unbuy";
  };

  const onNotificationClick = (notification: NotificationResponse) => {
    if (!notification.isRead) {
      markOneRead(notification.id).catch(() => {
        // noop
      });
    }
    setOpen(false);
    setMobileNotificationsOpen(false);
    router.push(getNotificationTarget(notification));
  };

  const mobileNavLink = (href: string, label: string) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={`font-jost block py-2 text-[13px] tracking-[0.12em] uppercase ${
          active ? "text-gold" : "text-[#888888]"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <AnnouncementBar />
      <header className="fixed top-9 right-0 left-0 z-50 h-[60px] border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="relative mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 sm:px-12">
          <Link href="/" className="z-[1] flex items-center gap-1.5">
            <span className="text-base font-bold text-gold">✓</span>
            <span className="font-serif text-lg font-bold text-cream">
              On The List
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
            <Link
              href="/"
              className="flex items-center pb-1"
              aria-label="Home"
            >
              <Home
                className={`h-[18px] w-[18px] transition-colors duration-200 ${
                  pathname === "/" ? "text-gold" : "text-[#888888] hover:text-cream"
                }`}
                strokeWidth={1.5}
              />
            </Link>
            {CENTER_LINKS.map((link) => (
              <CenterNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isActive(link.href)}
              />
            ))}
          </nav>

          <div className="z-[1] hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="relative p-1 text-[#888888] transition-colors hover:text-gold"
                    aria-label="Notifications"
                  >
                    <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-void">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {open && (
                    <div className="absolute top-[calc(100%+12px)] right-0 z-50 w-[300px] overflow-hidden rounded-lg border border-border bg-[#1A1A1A] shadow-2xl">
                      <div className="border-b border-border px-4 py-3">
                        <span className="font-jost text-[10px] font-semibold tracking-[0.1em] text-[#555555] uppercase">
                          Notifications
                        </span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                          <div className="px-4 py-6 text-sm text-cream/60">
                            Loading...
                          </div>
                        ) : formattedNotifications.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-cream/60">
                            No notifications yet.
                          </div>
                        ) : (
                          formattedNotifications.map((n, i) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => onNotificationClick(n)}
                              className={`flex w-full gap-2.5 border-b px-4 py-3.5 text-left transition hover:bg-[#141414] ${
                                i === formattedNotifications.length - 1
                                  ? "border-transparent"
                                  : "border-[#1E1E1E]"
                              } ${n.isRead ? "opacity-70" : ""}`}
                            >
                              <span
                                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                                  n.isRead ? "bg-[#555555]" : "bg-gold"
                                }`}
                              />
                              <div>
                                <p className="text-xs leading-relaxed text-cream">
                                  {n.title}
                                  {n.body ? ` — ${n.body}` : ""}
                                </p>
                                <p className="mt-1 text-[11px] text-[#555555]">
                                  {formatWhen(n.createdAt)}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <UserMenu />
              </>
            ) : (
              <Link href="/signup" className="nav-sign-up">
                Sign Up
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMobileNotificationsOpen((v) => !v);
                }}
                className="relative p-2 text-[#888888]"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-void">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMobileNotificationsOpen(false);
                setMobileMenuOpen((v) => !v);
              }}
              className="p-2 text-cream/60"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-[60px] right-0 left-0 z-[100] border-b border-[#1A1A1A] bg-[#0A0A0A] px-12 py-4 md:hidden">
            {mobileNavLink("/events", "Buy")}
            {mobileNavLink("/unbuy", "Un-buy")}
            {user ? (
              mobileNavLink("/unbuy", "My Tickets")
            ) : (
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="font-jost block py-2 text-[13px] tracking-[0.12em] text-gold uppercase"
              >
                Sign Up
              </Link>
            )}
          </div>
        )}

        {mobileNotificationsOpen && user && (
          <div
            className="fixed inset-0 z-[70] md:hidden"
            aria-modal="true"
            role="dialog"
          >
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setMobileNotificationsOpen(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
            />
            <aside className="absolute inset-x-3 top-24 overflow-hidden rounded-2xl border border-border bg-void shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-3 py-3">
                <button
                  type="button"
                  onClick={() => setMobileNotificationsOpen(false)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-cream/70"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <p className="text-xs font-semibold tracking-[0.14em] text-cream/80 uppercase">
                  Notifications
                </p>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-gold"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-[68vh] overflow-y-auto bg-void">
                {loading ? (
                  <div className="px-4 py-6 text-sm text-cream/60">
                    Loading...
                  </div>
                ) : formattedNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-cream/60">
                    No notifications yet.
                  </div>
                ) : (
                  formattedNotifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onNotificationClick(n)}
                      className={`w-full border-b border-border px-4 py-3 text-left transition hover:bg-surface/30 ${
                        n.isRead ? "opacity-70" : ""
                      }`}
                    >
                      <p className="text-sm font-semibold text-cream">
                        {n.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-cream/70">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[11px] text-cream/50">
                        {formatWhen(n.createdAt)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </header>
    </>
  );
}

export const SITE_HEADER_OFFSET = "pt-24";
