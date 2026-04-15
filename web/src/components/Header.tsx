"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Bell, Menu } from "lucide-react";
import UserMenu from "./UserMenu";
import { createBrowserClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { NotificationResponse } from "@/lib/shared";

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
    if (!open || !user) return;

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
  }, [open, user]);

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
                        onClick={() => {
                          if (!n.isRead) {
                            markOneRead(n.id).catch(() => {
                              // noop
                            });
                          }
                        }}
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
