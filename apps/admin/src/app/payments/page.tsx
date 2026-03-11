"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { OrderResponse, OrderStats } from "@fatsoma/api-client";
import {
  CreditCard,
  Search,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Banknote,
  TicketCheck,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  paid: { label: "Paid", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-300 border-amber-500/40", icon: Clock },
  failed: { label: "Failed", color: "bg-rose-500/10 text-rose-300 border-rose-500/40", icon: XCircle },
  expired: { label: "Expired", color: "bg-zinc-500/10 text-cream/60 border-zinc-500/40", icon: AlertCircle },
};

export default function PaymentsPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    if (!token) return;
    const client = createApiClient(token);

    const [ordersRes, statsRes] = await Promise.all([
      client.getOrders({
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        search: debouncedSearch || undefined,
      }),
      client.getOrderStats(),
    ]);

    if (ordersRes.ok && ordersRes.data) setOrders(ordersRes.data);
    if (statsRes.ok && statsRes.data) setStats(statsRes.data);
    setLoading(false);
  }, [token, statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header>
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
            <span className="h-px w-10 bg-linear-to-r from-gold to-gold-light" />
            Payments
          </div>
          <h1 className="text-3xl font-semibold text-cream sm:text-4xl">Payment History</h1>
          <p className="mt-2 max-w-2xl text-sm text-cream/60">
            Track all ticket purchases, resale transactions, revenue, and booking fees.
          </p>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <StatCard
              icon={<Receipt className="h-5 w-5" />}
              label="Total Orders"
              value={stats.totalOrders.toString()}
              color="text-gold"
            />
            <StatCard
              icon={<CheckCircle className="h-5 w-5" />}
              label="Paid"
              value={stats.paidOrders.toString()}
              color="text-emerald-400"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Pending"
              value={stats.pendingOrders.toString()}
              color="text-amber-400"
            />
            <StatCard
              icon={<Banknote className="h-5 w-5" />}
              label="Revenue"
              value={formatCurrency(stats.totalRevenue)}
              color="text-emerald-400"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Fees Collected"
              value={formatCurrency(stats.totalFees)}
              color="text-gold-light"
            />
            <StatCard
              icon={<RefreshCw className="h-5 w-5" />}
              label="Resale Orders"
              value={stats.resaleOrders.toString()}
              color="text-amber-400"
            />
            <StatCard
              icon={<CreditCard className="h-5 w-5" />}
              label="Resale Revenue"
              value={formatCurrency(stats.resaleRevenue)}
              color="text-amber-400"
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/60" />
            <input
              type="text"
              placeholder="Search by event, customer, or session ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/60 py-2.5 pl-10 pr-4 text-sm text-cream outline-none transition placeholder:text-cream/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Type filter */}
            {["all", "primary", "resale"].map((t) => (
              <button
                key={`type-${t}`}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  typeFilter === t
                    ? t === "resale"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-gold/20 text-gold border border-gold/40"
                    : "border border-border bg-white/5 text-cream/60 hover:bg-white/10 hover:text-cream/90"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}

            <div className="mx-1 w-px bg-white/10" />

            {/* Status filter */}
            {["all", "paid", "pending", "failed", "expired"].map((s) => (
              <button
                key={`status-${s}`}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  statusFilter === s
                    ? "bg-gold/20 text-gold border border-gold/40"
                    : "border border-border bg-white/5 text-cream/60 hover:bg-white/10 hover:text-cream/90"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center rounded-3xl border border-border bg-void/60 p-12">
            <div className="text-center">
              <TicketCheck className="mx-auto mb-3 h-10 w-10 text-cream/60" />
              <h3 className="text-lg font-semibold text-cream">No payments found</h3>
              <p className="mt-2 text-sm text-cream/60">
                {debouncedSearch || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters or search query."
                  : "Payments will appear here once users purchase tickets."}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-void/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Order</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Type</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Customer</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Event</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Ticket</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-cream/60">Qty</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-cream/60">Base</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-cream/60">Fee</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-cream/60">Total</th>
                    {typeFilter === "resale" && (
                      <>
                        <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-amber-400">Seller Gets</th>
                        <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-amber-400">Organiser Gets</th>
                      </>
                    )}
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-cream/60">Date</th>
                    <th className="px-5 py-4 text-center text-xs font-medium uppercase tracking-wider text-cream/60">Stripe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    const isResale = order.type === "resale";

                    return (
                      <tr key={order.id} className="transition hover:bg-white/2">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-cream/60">
                            {order.id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            isResale
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-gold/10 text-gold border border-gold/30"
                          }`}>
                            {isResale && <RefreshCw className="h-2.5 w-2.5" />}
                            {isResale ? "Resale" : "Primary"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-cream">
                              {order.customerName || "—"}
                            </p>
                            <p className="truncate text-xs text-cream/60">
                              {order.customerEmail || "—"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[160px] truncate text-sm text-cream/90">{order.eventName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-cream/60">{order.ticketBatchName}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm text-cream/90">{order.quantity}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm text-cream/60">
                            {formatCurrency(order.basePrice)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm text-gold-light">
                            {formatCurrency(order.capturedBookingFee)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm font-semibold text-cream">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </td>
                        {typeFilter === "resale" && (
                          <>
                            <td className="px-5 py-4 text-right">
                              <span className="font-mono text-sm text-amber-300">
                                {order.sellerPayout != null ? formatCurrency(order.sellerPayout) : "—"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-mono text-sm text-amber-300">
                                {order.organiserRevenue != null ? formatCurrency(order.organiserRevenue) : "—"}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap text-xs text-cream/60">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {order.stripePaymentIntentId ? (
                            <a
                              href={`https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-gold transition hover:text-gold"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-cream/60">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3">
              <p className="text-xs text-cream/60">
                Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-void/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span className="text-xs font-medium uppercase tracking-wider text-cream/60">{label}</span>
      </div>
      <p className="font-mono text-2xl font-bold text-cream">{value}</p>
    </div>
  );
}
