"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, Bell, Menu, X, ChevronLeft } from "lucide-react";
import UserMenu from "./UserMenu";
import { createBrowserClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { NotificationResponse } from "@/lib/shared";

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
        return "/tickets";
      case "calendar_connected":
        return "/events";
      default:
        break;
    }

    if (typeof eventId === "string" && eventId.length > 0) {
      return `/events/${eventId}`;
    }

    return "/tickets";
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

  const mobileNavLink = (href: string, label: string) => {
    const isActive =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={`block w-full rounded-xl border px-4 py-3 text-left text-base font-medium transition-colors ${
          isActive
            ? "border-gold/50 bg-gold/10 text-gold"
            : "border-border bg-surface/20 text-cream hover:border-gold/40 hover:text-gold"
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
              onClick={() => setOpen((v) => !v)}
              className="relative p-1 text-muted transition-colors hover:text-cream"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-void">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div
                ref={dropdownRef}
                className="absolute right-0 top-9 z-50 w-88 overflow-hidden rounded-2xl border border-border bg-void/95 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-cream">
                    Notifications
                  </h3>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-gold transition hover:text-gold-light"
                  >
                    Mark all read
                  </button>
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
                    formattedNotifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => onNotificationClick(n)}
                        className={`w-full border-b border-border px-4 py-3 text-left transition hover:bg-surface/30 ${
                          n.isRead ? "opacity-70" : ""
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-cream">
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
                          )}
                        </div>
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
              </div>
            )}
          </div>

          <UserMenu />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setMobileNotificationsOpen((v) => !v);
              }}
              className="p-2 text-muted transition-colors hover:text-cream"
              aria-label="Notifications"
              aria-expanded={mobileNotificationsOpen}
              aria-controls="mobile-notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-void">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setMobileNotificationsOpen(false);
              setMobileMenuOpen((v) => !v);
            }}
            className="p-2 text-muted transition-colors hover:text-cream"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-[70] md:hidden"
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"
          />

          <aside className="absolute right-0 top-0 flex h-dvh w-full flex-col border-l border-border bg-void shadow-2xl sm:w-[82vw] sm:max-w-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cream/80">
                Menu
              </p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-surface/30 hover:text-cream"
                aria-label="Close side drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-3 overflow-y-auto bg-void px-4 py-5">
              {mobileNavLink("/", "Home")}
              {mobileNavLink("/events", "Events")}
              {mobileNavLink("/tickets", "My Tickets")}
            </nav>
          </aside>
        </div>
      )}

      {mobileNotificationsOpen && (
        <div
          id="mobile-notifications"
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

          <aside className="absolute inset-x-3 top-18 overflow-hidden rounded-2xl border border-border bg-void shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-3">
              <button
                type="button"
                onClick={() => setMobileNotificationsOpen(false)}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-cream/70 transition-colors hover:bg-surface/30 hover:text-cream"
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cream/80">
                Notifications
              </p>
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-gold transition hover:text-gold-light"
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
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-cream">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
                      )}
                    </div>
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
  );
}
