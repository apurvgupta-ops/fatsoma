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
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  paid: { label: "Paid", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-300 border-amber-500/40", icon: Clock },
  failed: { label: "Failed", color: "bg-rose-500/10 text-rose-300 border-rose-500/40", icon: XCircle },
  expired: { label: "Expired", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/40", icon: AlertCircle },
};

export default function PaymentsPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
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
        search: debouncedSearch || undefined,
      }),
      client.getOrderStats(),
    ]);

    if (ordersRes.ok && ordersRes.data) setOrders(ordersRes.data);
    if (statsRes.ok && statsRes.data) setStats(statsRes.data);
    setLoading(false);
  }, [token, statusFilter, debouncedSearch]);

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
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
            <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
            Payments
          </div>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Payment History</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Track all ticket purchases, revenue, and booking fees collected from end users.
          </p>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={<Receipt className="h-5 w-5" />}
              label="Total Orders"
              value={stats.totalOrders.toString()}
              color="text-purple-400"
            />
            <StatCard
              icon={<CheckCircle className="h-5 w-5" />}
              label="Paid Orders"
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
              label="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              color="text-emerald-400"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Fees Collected"
              value={formatCurrency(stats.totalFees)}
              color="text-blue-400"
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by event, customer, or session ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex gap-2">
            {["all", "paid", "pending", "failed", "expired"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  statusFilter === s
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-60 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950/60 p-12">
            <div className="text-center">
              <TicketCheck className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
              <h3 className="text-lg font-semibold text-white">No payments found</h3>
              <p className="mt-2 text-sm text-zinc-400">
                {debouncedSearch || statusFilter !== "all"
                  ? "Try adjusting your filters or search query."
                  : "Payments will appear here once users purchase tickets."}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Order</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Customer</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Event</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Ticket</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">Qty</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">Base</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">Fee</th>
                    <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">Total</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Date</th>
                    <th className="px-5 py-4 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">Stripe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={order.id} className="transition hover:bg-white/2">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-zinc-500">
                            {order.id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {order.customerName || "—"}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {order.customerEmail || "—"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[160px] truncate text-sm text-zinc-200">{order.eventName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-zinc-400">{order.ticketBatchName}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm text-zinc-300">{order.quantity}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm text-zinc-400">
                            {formatCurrency(order.basePrice)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm text-blue-400">
                            {formatCurrency(order.capturedBookingFee)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-sm font-semibold text-white">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap text-xs text-zinc-500">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {order.stripePaymentIntentId ? (
                            <a
                              href={`https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-purple-400 transition hover:text-purple-300"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-5 py-3">
              <p className="text-xs text-zinc-500">
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
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className={color}>{icon}</div>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <p className="font-mono text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
