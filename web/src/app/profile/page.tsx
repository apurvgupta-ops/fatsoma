"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createBrowserClient } from "@/lib/api";
import type { OrderResponse } from "@/lib/api-client";
import type { ResaleListingResponse } from "@/lib/shared";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Loader2,
  ShoppingBag,
  ArrowRight,
  Ticket,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [resaleListings, setResaleListings] = useState<ResaleListingResponse[]>(
    [],
  );
  const [historyTab, setHistoryTab] = useState<"purchase" | "resale">(
    "purchase",
  );
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchOrders = useCallback(async () => {
    try {
      const client = createBrowserClient();
      const [ordersRes, resaleRes] = await Promise.all([
        client.getMyOrders(),
        client.getMyResaleListings(),
      ]);

      if (ordersRes.ok && ordersRes.data) setOrders(ordersRes.data);
      if (resaleRes.ok && resaleRes.data) setResaleListings(resaleRes.data);
    } catch {
      // silently fail
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }
    fetchOrders();
  }, [user, authLoading, router, fetchOrders]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-void">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalSpent = paidOrders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-void text-cream/90">
      <Header />

      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="mb-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light text-2xl font-bold text-cream shadow-lg shadow-gold/20">
              {initials}
            </div>
            <div className="mt-4 sm:mt-0">
              <h1 className="font-serif text-3xl font-bold text-cream sm:text-4xl">
                {user.name}
              </h1>
              <p className="mt-1 text-sm text-cream/60">{user.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/60 px-3 py-1 text-xs text-cream/70">
                  <Shield className="h-3 w-3 text-gold" />
                  {user.role === "admin" ? "Admin" : "Member"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/60 px-3 py-1 text-xs text-cream/70">
                  <Calendar className="h-3 w-3 text-gold" />
                  Joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-cream/50">
                Total Orders
              </p>
              <p className="mt-1 text-2xl font-bold text-cream">
                {paidOrders.length}
              </p>
            </div>
            {/* <div className="rounded-xl border border-border bg-surface/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-cream/50">
                Total Spent
              </p>
              <p className="mt-1 text-2xl font-bold text-gold">
                £{totalSpent.toFixed(2)}
              </p>
            </div> */}
            <div className="rounded-xl border border-border bg-surface/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-cream/50">
                Account Status
              </p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                Active
              </p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="mb-10 rounded-xl border border-border bg-surface/40 p-6">
            <h2 className="mb-4 text-lg font-semibold text-cream">
              Profile Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-void/40 p-4">
                <User className="h-5 w-5 text-gold/70" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream/50">
                    Full Name
                  </p>
                  <p className="text-sm font-medium text-cream">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-void/40 p-4">
                <Mail className="h-5 w-5 text-gold/70" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream/50">
                    Email
                  </p>
                  <p className="text-sm font-medium text-cream">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-void/40 p-4">
                <Shield className="h-5 w-5 text-gold/70" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream/50">
                    Role
                  </p>
                  <p className="text-sm font-medium capitalize text-cream">
                    {user.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-void/40 p-4">
                <Calendar className="h-5 w-5 text-gold/70" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream/50">
                    Joined
                  </p>
                  <p className="text-sm font-medium text-cream">
                    {new Date(user.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="mb-6">
            <div className="mb-4 inline-flex rounded-lg border border-border bg-surface/30 p-1">
              <button
                type="button"
                onClick={() => setHistoryTab("purchase")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  historyTab === "purchase"
                    ? "bg-gold text-void"
                    : "text-cream/70 hover:text-cream"
                }`}
              >
                Purchase History
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab("resale")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  historyTab === "resale"
                    ? "bg-gold text-void"
                    : "text-cream/70 hover:text-cream"
                }`}
              >
                Resale History
              </button>
            </div>

            {historyTab === "purchase" ? (
              <PurchaseHistory
                orders={orders}
                loading={loadingOrders}
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            ) : (
              <ResaleHistory
                listings={resaleListings}
                loading={loadingOrders}
              />
            )}
          </div>

          {/* Sign Out */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="cursor-pointer text-sm font-medium text-red-400/80 transition hover:text-red-400 hover:underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function PurchaseHistory({
  orders,
  loading,
  currentPage,
  pageSize,
  onPageChange,
}: {
  orders: OrderResponse[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedOrders = orders.slice(startIdx, startIdx + pageSize);

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1,
  ).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
  );

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cream">Purchase History</h2>
        {/* <Link
          href="/tickets"
          className="cursor-pointer text-sm font-medium text-gold hover:underline"
        >
          View Tickets
        </Link> */}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-cream/20" />
          <p className="text-sm text-cream/60">No purchase history yet</p>
          <Link
            href="/events"
            className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gold hover:underline"
          >
            Browse Events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-void/40 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                  <Ticket className="h-5 w-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-cream">
                    {order.eventName}
                  </p>
                  <p className="mt-0.5 text-xs text-cream/50">
                    {order.ticketBatchName} · {order.quantity} ticket
                    {order.quantity > 1 ? "s" : ""} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-cream">
                    £{order.totalAmount.toFixed(2)}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
              <p className="text-xs text-cream/50">
                Showing {startIdx + 1}–
                {Math.min(startIdx + pageSize, orders.length)} of{" "}
                {orders.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-cream/60 transition hover:bg-white/5 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers.map((p, i) => {
                  const prev = pageNumbers[i - 1];
                  const showEllipsis = prev !== undefined && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-xs text-cream/40">…</span>
                      )}
                      <button
                        onClick={() => onPageChange(p)}
                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xs font-medium transition ${
                          p === currentPage
                            ? "bg-gold text-void"
                            : "border border-border text-cream/60 hover:bg-white/5 hover:text-cream"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-cream/60 transition hover:bg-white/5 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Paid
        </span>
      );
    case "failed":
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-red-400">
          <XCircle className="h-3 w-3" /> {status}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-amber-400">
          <Clock className="h-3 w-3" /> {status}
        </span>
      );
  }
}

function ResaleHistory({
  listings,
  loading,
}: {
  listings: ResaleListingResponse[];
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cream">Resale History</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : listings.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-cream/20" />
          <p className="text-sm text-cream/60">No resale history yet</p>
          <Link
            href="/tickets"
            className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gold hover:underline"
          >
            Go to My Tickets <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 rounded-lg border border-border/50 bg-void/40 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                <Ticket className="h-5 w-5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-cream">
                  {listing.eventName || `Event ${listing.eventId.slice(0, 8)}`}
                </p>
                <p className="mt-0.5 text-xs text-cream/50">
                  {listing.ticketBatchName || "Resale listing"} ·{" "}
                  {new Date(listing.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-cream">
                  £{listing.askingPrice.toFixed(2)}
                </p>
                <ResaleStatusBadge status={listing.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResaleStatusBadge({
  status,
}: {
  status: ResaleListingResponse["status"];
}) {
  switch (status) {
    case "sold":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Sold
        </span>
      );
    case "cancelled":
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-red-400">
          <XCircle className="h-3 w-3" /> {status}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-amber-400">
          <Clock className="h-3 w-3" /> {status}
        </span>
      );
  }
}
