"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import {
  PanelShell,
  PanelEyebrow,
  PanelTitle,
  StatGrid,
  GoldButton,
} from "@/components/organiser/OrganiserUi";
import type {
  WithdrawalBalance,
  WithdrawalRequestResponse,
} from "@/lib/api-client/client";
import { organiserPaths } from "@/lib/organiserPaths";

const card =
  "rounded-[10px] border border-[#222222] bg-[#141414] p-5";

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

function formatMoney(amount: number) {
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrganizerWithdrawalsPage() {
  const { token, user } = useAuth();
  const [balance, setBalance] = useState<WithdrawalBalance | null>(null);
  const [requests, setRequests] = useState<WithdrawalRequestResponse[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const client = createApiClient(token);
    const [balanceRes, listRes] = await Promise.all([
      client.getWithdrawalBalance(),
      client.getWithdrawalRequests(),
    ]);
    if (balanceRes.ok && balanceRes.data) setBalance(balanceRes.data);
    if (listRes.ok && listRes.data) setRequests(listRes.data);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const client = createApiClient(token);
      const res = await client.createWithdrawalRequest({
        amount: Number(amount),
        note: note.trim() || undefined,
      });
      if (!res.ok) throw new Error(res.message || "Failed to submit request");
      setAmount("");
      setNote("");
      setSuccess("Withdrawal request submitted for admin approval.");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = requests.some((r) => r.status === "pending");
  const stats = balance
    ? [
        { label: "TOTAL EARNED", value: formatMoney(balance.totalEarned) },
        { label: "RESERVED", value: formatMoney(balance.reserved) },
        { label: "AVAILABLE", value: formatMoney(balance.available) },
      ]
    : [];

  if (user?.role !== "organizer") {
    return (
      <AuthenticatedLayout>
        <PanelShell>
          <p className="font-sans text-[13px] text-[#888888]">
            Withdrawals are only available for organiser accounts.
          </p>
        </PanelShell>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <PanelShell>
        <PanelEyebrow>Organizer Admin Panel</PanelEyebrow>
        <PanelTitle
          title="Withdrawals"
          subtitle="Request a payout from your ticket sales. Admin approval is required before funds are sent."
        />

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : (
          <>
            <StatGrid stats={stats} columns={4} />

            <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <form onSubmit={handleSubmit} className={card}>
                <h2 className="mb-1 font-sans text-[15px] font-semibold text-cream">
                  Request withdrawal
                </h2>
                <p className="mb-4 font-sans text-xs text-[#888888]">
                  Minimum £5.00. One pending request at a time.
                </p>

                <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
                  Amount (£)
                </label>
                <input
                  type="number"
                  min="5"
                  step="0.01"
                  max={balance?.available ?? undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={hasPending || submitting}
                  className="mb-4 w-full rounded-md border border-[#222222] bg-[#0D0D0D] px-3 py-2 font-sans text-[13px] text-cream outline-none focus:border-gold disabled:opacity-50"
                />

                <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={hasPending || submitting}
                  maxLength={500}
                  rows={3}
                  placeholder="Bank details or reference for admin..."
                  className="mb-4 w-full resize-none rounded-md border border-[#222222] bg-[#0D0D0D] px-3 py-2 font-sans text-[13px] text-cream outline-none focus:border-gold disabled:opacity-50"
                />

                {error && (
                  <p className="mb-3 font-sans text-xs text-rose-300">{error}</p>
                )}
                {success && (
                  <p className="mb-3 font-sans text-xs text-emerald-300">{success}</p>
                )}

                {hasPending ? (
                  <p className="font-sans text-xs text-amber-200">
                    You have a pending request awaiting admin approval.
                  </p>
                ) : (
                  <GoldButton type="submit" disabled={submitting || !amount}>
                    {submitting ? "Submitting…" : "Submit request"}
                  </GoldButton>
                )}
              </form>

              <div className={card}>
                <h2 className="mb-3 font-sans text-[15px] font-semibold text-cream">
                  How it works
                </h2>
                <ol className="m-0 list-decimal space-y-2 pl-4 font-sans text-[13px] leading-relaxed text-[#888888]">
                  <li>Submit a withdrawal request for part or all of your available balance.</li>
                  <li>Admin reviews and approves or rejects the request.</li>
                  <li>Approved payouts are processed to your registered bank account.</li>
                </ol>
                <Link
                  href={organiserPaths.payments}
                  className="mt-4 inline-block font-sans text-xs text-gold no-underline hover:text-cream"
                >
                  View payment history →
                </Link>
              </div>
            </div>

            <h2 className="mb-4 font-sans text-[15px] font-semibold text-cream">
              Request history
            </h2>
            {requests.length === 0 ? (
              <p className="font-sans text-[13px] text-[#555555]">No withdrawal requests yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 rounded-lg border border-[#222222] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-sans text-[15px] font-semibold text-cream">
                        {formatMoney(req.amount)}
                      </div>
                      <div className="mt-1 font-sans text-xs text-[#888888]">
                        {new Date(req.createdAt).toLocaleString("en-GB")}
                      </div>
                      {req.note && (
                        <div className="mt-2 font-sans text-xs text-[#888888]">
                          Note: {req.note}
                        </div>
                      )}
                      {req.adminNote && (
                        <div className="mt-1 font-sans text-xs text-rose-300">
                          Admin: {req.adminNote}
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-semibold tracking-[0.08em] uppercase ${STATUS_STYLES[req.status] ?? ""}`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PanelShell>
    </AuthenticatedLayout>
  );
}
