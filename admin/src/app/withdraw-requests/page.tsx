"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import {
  PanelShell,
  PanelEyebrow,
  PanelTitle,
} from "@/components/organiser/OrganiserUi";
import type { WithdrawalRequestResponse } from "@/lib/api-client/client";

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

function formatMoney(amount: number) {
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminWithdrawRequestsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequestResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const client = createApiClient(token);
    const res = await client.getWithdrawalRequests({
      status: statusFilter === "all" ? undefined : statusFilter,
    });
    if (res.ok && res.data) setRequests(res.data);
    setLoading(false);
  }, [token, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string) => {
    if (!token || actingId) return;
    setActingId(id);
    setError(null);
    try {
      const client = createApiClient(token);
      const res = await client.approveWithdrawalRequest(id);
      if (!res.ok) throw new Error(res.message || "Failed to approve");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectId || actingId) return;
    setActingId(rejectId);
    setError(null);
    try {
      const client = createApiClient(token);
      const res = await client.rejectWithdrawalRequest(
        rejectId,
        rejectNote.trim() || undefined,
      );
      if (!res.ok) throw new Error(res.message || "Failed to reject");
      setRejectId(null);
      setRejectNote("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActingId(null);
    }
  };

  if (user?.role !== "admin") {
    return (
      <AuthenticatedLayout>
        <PanelShell>
          <p className="font-sans text-[13px] text-[#888888]">
            Admin access required.
          </p>
        </PanelShell>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <PanelShell>
        <PanelEyebrow>Admin Panel</PanelEyebrow>
        <PanelTitle
          title="Withdraw Requests"
          subtitle="Review and approve organiser payout requests."
        />

        <div className="mb-6 flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-sans text-xs capitalize transition-colors ${
                statusFilter === status
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-[#222222] bg-transparent text-[#888888] hover:text-cream"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
            <p className="font-sans text-sm text-rose-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <p className="font-sans text-[13px] text-[#555555]">
            No {statusFilter === "all" ? "" : statusFilter} withdrawal requests.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-[10px] border border-[#222222] bg-[#141414] p-5"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-sans text-lg font-semibold text-cream">
                      {formatMoney(req.amount)}
                    </div>
                    <div className="mt-1 font-sans text-[13px] text-cream">
                      {req.organizerName ?? "Organiser"}
                    </div>
                    <div className="font-sans text-xs text-[#888888]">
                      {req.organizerEmail}
                    </div>
                    <div className="mt-2 font-sans text-xs text-[#888888]">
                      Requested {new Date(req.createdAt).toLocaleString("en-GB")}
                    </div>
                    {req.note && (
                      <div className="mt-2 font-sans text-xs text-[#888888]">
                        Organiser note: {req.note}
                      </div>
                    )}
                    {req.adminNote && (
                      <div className="mt-1 font-sans text-xs text-rose-300">
                        Rejection reason: {req.adminNote}
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-semibold tracking-[0.08em] uppercase ${STATUS_STYLES[req.status] ?? ""}`}
                  >
                    {req.status}
                  </span>
                </div>

                {req.status === "pending" && (
                  <div className="flex flex-wrap gap-2.5 border-t border-[#222222] pt-4">
                    <button
                      type="button"
                      disabled={actingId === req.id}
                      onClick={() => handleApprove(req.id)}
                      className="cursor-pointer rounded border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-sans text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {actingId === req.id ? "Approving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={actingId === req.id}
                      onClick={() => {
                        setRejectId(req.id);
                        setRejectNote("");
                      }}
                      className="cursor-pointer rounded border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-sans text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {rejectId === req.id && (
                  <div className="mt-4 rounded-lg border border-[#222222] bg-[#0D0D0D] p-4">
                    <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
                      Rejection reason (optional)
                    </label>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={2}
                      className="mb-3 w-full resize-none rounded-md border border-[#222222] bg-[#141414] px-3 py-2 font-sans text-[13px] text-cream outline-none focus:border-gold"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={actingId === req.id}
                        className="cursor-pointer rounded border border-rose-500/40 px-3 py-1.5 font-sans text-xs text-rose-300 disabled:opacity-50"
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectId(null)}
                        className="cursor-pointer border-none bg-transparent px-3 py-1.5 font-sans text-xs text-[#888888]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PanelShell>
    </AuthenticatedLayout>
  );
}
