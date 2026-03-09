"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPublicClient } from "@/lib/api";
import type { CheckoutOrder } from "@fatsoma/api-client";
import Link from "next/link";
import { CheckCircle, Ticket, ArrowLeft, Loader2 } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session found");
      setLoading(false);
      return;
    }

    const client = createPublicClient();
    client
      .confirmCheckoutSession(sessionId)
      .then((res) => {
        if (res.ok && res.data) setOrder(res.data);
        else setError("Order not found");
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f0f0f]">
        <p className="text-lg text-zinc-400">{error || "Something went wrong"}</p>
        <Link href="/" className="text-sm text-purple-400 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-purple-500/15 blur-[160px]" />

        <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">Booking Confirmed!</h1>
          <p className="mt-3 max-w-md text-sm text-zinc-400">
            Your tickets have been reserved. You&apos;ll receive a confirmation email shortly.
          </p>

          <div className="mt-8 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/60 p-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Order Summary</h2>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Event" value={order.eventName} />
              <Row label="Ticket" value={order.ticketBatchName} />
              <Row label="Quantity" value={String(order.quantity)} />
              <Row label="Base Price" value={`£${order.basePrice.toFixed(2)} × ${order.quantity}`} />
              <Row
                label="Booking Fee (captured)"
                value={`£${order.capturedBookingFee.toFixed(2)} × ${order.quantity}`}
              />
              <div className="border-t border-white/10 pt-3">
                <Row
                  label="Total Paid"
                  value={`£${order.totalAmount.toFixed(2)}`}
                  bold
                />
              </div>
              <Row label="Status" value={order.status === "paid" ? "Paid" : "Processing"} />
              <Row
                label="Date"
                value={new Date(order.createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Browse More Events
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={bold ? "font-mono text-lg font-bold text-white" : "font-mono text-zinc-200"}>
        {value}
      </span>
    </div>
  );
}
