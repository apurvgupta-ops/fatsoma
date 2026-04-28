"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventResponse } from "@/lib/shared";
import type { StripeConnectStatus } from "@/lib/api-client/client";
import Link from "next/link";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);

  useEffect(() => {
    if (!token) return;
    const client = createApiClient(token);
    Promise.all([client.getEvents(), client.getStripeConnectStatus()])
      .then(([eventsRes, stripeRes]) => {
        if (eventsRes.ok && eventsRes.data) setEvents(eventsRes.data);
        if (stripeRes.ok && stripeRes.data) setStripeStatus(stripeRes.data);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const isOrganizer = user?.role === "organizer";
  const resolvedStripeStatus = stripeStatus ?? {
    stripeConnectAccountId: user?.stripeConnectAccountId ?? null,
    stripeConnectOnboardingComplete: Boolean(user?.stripeConnectOnboardingComplete),
    stripeConnectChargesEnabled: Boolean(user?.stripeConnectChargesEnabled),
    stripeConnectPayoutsEnabled: Boolean(user?.stripeConnectPayoutsEnabled),
    stripeConnectDetailsSubmitted: Boolean(user?.stripeConnectDetailsSubmitted),
    requirementsCurrentlyDue: [],
  };
  const hasStripeAccount = Boolean(resolvedStripeStatus.stripeConnectAccountId);
  const isStripeReady =
    Boolean(resolvedStripeStatus.stripeConnectAccountId) &&
    Boolean(resolvedStripeStatus.stripeConnectOnboardingComplete) &&
    Boolean(resolvedStripeStatus.stripeConnectChargesEnabled) &&
    Boolean(resolvedStripeStatus.stripeConnectPayoutsEnabled) &&
    Boolean(resolvedStripeStatus.stripeConnectDetailsSubmitted);

  const handleConnectStripe = async () => {
    if (!token || connectingStripe) return;
    setConnectingStripe(true);
    setStripeError(null);
    try {
      const client = createApiClient(token);
      const res = await client.createStripeOnboardingLink();
      const url = res.data?.url;
      if (!url) {
        throw new Error("Failed to generate onboarding link");
      }
      window.location.href = url;
    } catch (err: unknown) {
      setStripeError(err instanceof Error ? err.message : "Failed to connect Stripe");
      setConnectingStripe(false);
    }
  };

  const published = events.filter((e) => e.status === "published").length;
  const drafts = events.filter((e) => e.status === "draft").length;
  const totalRevenue = events.reduce(
    (s, e) => s + e.ticketBatches.reduce((t, b) => t + b.quantity * b.basePrice, 0), 0
  );

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header>
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
            <span className="h-px w-10 bg-linear-to-r from-gold to-gold-light" />
            Organizer Admin Panel
          </div>
          <h1 className="text-3xl font-semibold text-cream sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-cream/60">
            Overview of your events and platform metrics.
          </p>
        </header>

        {isOrganizer && !isStripeReady && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-300">Stripe Connect required</p>
                <p className="mt-1 text-sm text-amber-200/80">
                  {hasStripeAccount
                    ? "Your Stripe account exists, but onboarding is not complete yet. Complete setup to publish events and accept ticket payments."
                    : "Connect Stripe to publish events and accept ticket payments."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connectingStripe
                  ? "Opening Stripe..."
                  : hasStripeAccount
                    ? "Complete Stripe setup"
                    : "Connect Stripe"}
              </button>
            </div>
            {resolvedStripeStatus.requirementsCurrentlyDue &&
              resolvedStripeStatus.requirementsCurrentlyDue.length > 0 && (
                <p className="mt-2 text-xs text-amber-200/70">
                  Pending Stripe requirements:{" "}
                  {resolvedStripeStatus.requirementsCurrentlyDue.length}
                </p>
              )}
            {stripeError && (
              <p className="mt-3 text-sm text-rose-300">{stripeError}</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Events" value={events.length.toString()} accent="purple" href="/events" />
              <StatCard label="Published" value={published.toString()} accent="emerald" href="/events" />
              <StatCard label="Drafts" value={drafts.toString()} accent="amber" href="/events" />
              <StatCard label="Gross Revenue" value={`£${totalRevenue.toLocaleString()}`} accent="blue" href="/payments" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-cream">Recent Events</h2>
                <Link href="/events" className="text-sm text-gold hover:text-gold transition">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <Link key={event.id} href={`/events/${event.id}/edit`} className="flex items-center justify-between rounded-2xl border border-border bg-void/60 px-5 py-4 transition hover:border-gold/30 hover:bg-void/80">
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${event.status === "published" ? "bg-gold" : "bg-gold-light/60"}`} />
                      <div>
                        <p className="text-sm font-semibold text-cream">{event.eventName}</p>
                        <p className="text-xs text-cream/60">{event.venueName} · {new Date(event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-border bg-surface/60 px-2 py-0.5 text-xs text-cream/60">{event.eventCategory}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function StatCard({ label, value, accent, href }: { label: string; value: string; accent: string; href?: string }) {
  const colors: Record<string, string> = {
    purple: "from-gold/20 to-gold/5 border-gold/30 text-gold",
    blue: "from-gold-light/20 to-gold-light/5 border-gold-light/30 text-gold-light",
    emerald: "from-gold/15 to-gold/5 border-gold/25 text-gold",
    amber: "from-gold-light/15 to-gold-light/5 border-gold-light/25 text-gold-light",
  };
  const c = colors[accent] || colors.purple;
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-cream/60">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`block rounded-2xl border bg-linear-to-br p-5 transition hover:brightness-110 ${c}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`rounded-2xl border bg-linear-to-br p-5 ${c}`}>
      {content}
    </div>
  );
}

