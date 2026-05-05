"use client";

import { useState, type FormEvent } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { createApiClient } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { TicketScanValidationResult } from "@/lib/shared";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string; errors?: Array<{ message?: string }> } | undefined;
    return body?.errors?.[0]?.message || body?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function ScannerPage() {
  const { token, user } = useAuth();
  const [qrCode, setQrCode] = useState("");
  const [eventId, setEventId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TicketScanValidationResult | null>(null);

  const handleScan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || submitting) return;

    const code = qrCode.trim();
    if (!code) {
      setError("Paste or scan a QR code first");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const client = createApiClient(token);
      const res = await client.validateTicketScan({
        qrCode: code,
        ...(eventId.trim() ? { eventId: eventId.trim() } : {}),
      });
      setResult(res.data ?? null);
      if (res.data?.valid) setQrCode("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to validate QR code"));
    } finally {
      setSubmitting(false);
    }
  };

  const quantity =
    result?.bundle?.quantity ?? (result?.valid && result.ticket ? 1 : 0);
  const holderName = result?.bundle?.holderName ?? result?.holder?.name ?? "-";
  const holderEmail =
    result?.bundle?.holderEmail ?? result?.holder?.email ?? "-";
  const totalPrice =
    result?.bundle?.totalPrice ?? result?.order?.totalAmount ?? result?.ticket?.purchasePrice;

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-cream">Ticket Scanner</h1>
          <p className="mt-1 text-sm text-cream/60">
            Scan or paste a QR code to validate entry. A valid scan marks the ticket as used.
          </p>
        </header>

        {user?.role === "staff" && user.staffAssignedEvent && (
          <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
            You are scanning for{" "}
            <span className="font-semibold text-cream">{user.staffAssignedEvent.eventName}</span>.
            {user.staffGateName ? (
              <>
                {" "}Gate: <span className="font-semibold text-cream">{user.staffGateName}</span>.
                Only tickets for this event and gate can be validated.
              </>
            ) : (
              <> Only tickets for this event can be validated.</>
            )}
          </div>
        )}

        <form
          onSubmit={handleScan}
          className="rounded-3xl border border-border bg-void/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <div className="grid gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-cream/60">QR code</span>
              <textarea
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                placeholder="Scan or paste bundle:v1:... or an individual ticket QR"
                className="min-h-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
              />
            </label>

            {user?.role !== "staff" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-cream/60">
                  Event ID optional
                </span>
                <input
                  value={eventId}
                  onChange={(event) => setEventId(event.target.value)}
                  placeholder="Only required if you want to reject other-event tickets"
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold/50"
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Checking..." : "Validate Entry"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {result && (
          <section
            className={`rounded-3xl border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${
              result.valid
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-rose-500/40 bg-rose-500/10"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wider ${result.valid ? "text-emerald-300" : "text-rose-300"}`}>
                  {result.valid ? "Valid entry" : "Not valid"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-cream">{result.message}</h2>
              </div>
              <span className="rounded-full border border-border bg-void/60 px-3 py-1 text-xs text-cream/70">
                {result.reason}
              </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Quantity" value={String(quantity)} />
              <Info label="Holder" value={holderName || "-"} />
              <Info label="Email" value={holderEmail || "-"} />
              <Info label="Event" value={result.ticket?.eventName ?? "-"} />
              <Info label="Ticket tier" value={result.ticket?.ticketBatchName ?? "-"} />
              <Info label="Ticket status" value={result.ticket?.status ?? "-"} />
              <Info label="Entry time" value={result.scannedAt ? new Date(result.scannedAt).toLocaleString("en-GB") : "-"} />
              <Info label="Entry cutoff" value={result.entryWindowCutoff ? new Date(result.entryWindowCutoff).toLocaleString("en-GB") : "-"} />
              <Info label="Total price" value={typeof totalPrice === "number" ? totalPrice.toFixed(2) : "-"} />
              <Info label="Order" value={result.bundle?.orderId ?? result.order?.id ?? "-"} />
            </div>
          </section>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-void/50 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-cream/45">{label}</p>
      <p className="mt-1 wrap-break-word text-sm font-medium text-cream">{value}</p>
    </div>
  );
}
