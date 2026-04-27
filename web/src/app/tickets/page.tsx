"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { createBrowserClient } from "@/lib/api";
import type { TicketResponse, ResaleListingResponse } from "@/lib/shared";
import {
  Ticket,
  ArrowRight,
  X,
  Loader2,
  AlertCircle,
  Check,
  ZoomIn,
  DollarSign,
  Search,
  Gift,
  Download,
  ChevronDown,
} from "lucide-react";

// AlertCircle is used in error div
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type TabId = "active" | "resale" | "sold" | "history";

type GroupedTicket = {
  key: string;
  representative: TicketResponse;
  tickets: TicketResponse[];
  quantity: number;
};

type ResaleModalState = {
  representative: TicketResponse;
  tickets: TicketResponse[];
  quantity: number;
};

export default function MyTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("active");

  const [resaleModal, setResaleModal] = useState<ResaleModalState | null>(null);
  const [resaleAcknowledge, setResaleAcknowledge] = useState(false);
  const [giftModal, setGiftModal] = useState<TicketResponse | null>(null);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftAcknowledge, setGiftAcknowledge] = useState(false);
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState<TicketResponse | null>(
    null,
  );
  const [soldListings, setSoldListings] = useState<ResaleListingResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      const client = createBrowserClient();
      const [ticketRes, listingRes] = await Promise.all([
        client.getMyTickets(),
        client.getMyResaleListings(),
      ]);
      if (ticketRes.ok && ticketRes.data) setTickets(ticketRes.data);
      if (listingRes.ok && listingRes.data)
        setSoldListings(listingRes.data.filter((l) => l.status === "sold"));
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/tickets");
      return;
    }
    fetchTickets();
  }, [user, authLoading, router, fetchTickets]);

  const handleListForResale = async () => {
    if (!resaleModal) return;
    if (!resaleAcknowledge) {
      setActionError("Please confirm that you understand the resale terms");
      return;
    }

    const price = resaleModal.representative.currentBatchPrice;
    const selectedTickets = resaleModal.tickets.slice(0, resaleModal.quantity);

    setSubmitting(true);
    setActionError("");
    try {
      const client = createBrowserClient();
      for (const ticket of selectedTickets) {
        await client.listTicketForResale({
          ticketId: ticket.id,
          askingPrice: price,
        });
      }
      setResaleModal(null);
      setResaleAcknowledge(false);
      setSuccessMessage(
        selectedTickets.length > 1
          ? `${selectedTickets.length} tickets listed for resale successfully!`
          : "Ticket listed for resale successfully!",
      );
      setTimeout(() => setSuccessMessage(""), 5000);
      fetchTickets();
    } catch (err: any) {
      setActionError(err.message || "Failed to list ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelListing = async (ticket: TicketResponse) => {
    setCancelConfirm(null);
    try {
      const client = createBrowserClient();
      const listings = await client.getResaleListings(ticket.eventId);
      const myListing = listings.data?.find(
        (l) => l.ticketId === ticket.id && l.sellerId === user?.id,
      );
      if (!myListing) return;
      await client.cancelResaleListing(myListing.id);
      setSuccessMessage("Resale listing cancelled successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
      fetchTickets();
    } catch (err: any) {
      setError(err.message || "Failed to cancel listing");
    }
  };

  const handleGiftTicket = async () => {
    if (!giftModal) return;
    if (!giftRecipientName.trim()) {
      setActionError("Please enter the recipient name");
      return;
    }
    if (!giftAcknowledge) {
      setActionError("Please confirm that this gift is irreversible");
      return;
    }

    setGiftSubmitting(true);
    setActionError(
      "Gift transfer endpoint is not available yet. Please use resale for now.",
    );
    setGiftSubmitting(false);
  };

  const activeTickets = tickets.filter((t) => t.status === "active");
  const resaleTickets = tickets.filter((t) => t.status === "listed");
  const historyTickets = tickets.filter((t) =>
    ["transferred", "used", "cancelled"].includes(t.status),
  );

  const displayedTickets =
    activeTab === "active"
      ? activeTickets
      : activeTab === "resale"
        ? resaleTickets
        : activeTab === "history"
          ? historyTickets
          : [];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTickets = normalizedQuery
    ? displayedTickets.filter((ticket) => {
        const venue = [ticket.venueName, ticket.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          ticket.eventName.toLowerCase().includes(normalizedQuery) ||
          ticket.ticketBatchName.toLowerCase().includes(normalizedQuery) ||
          venue.includes(normalizedQuery) ||
          ticket.qrCode.toLowerCase().includes(normalizedQuery)
        );
      })
    : displayedTickets;

  const groupedActiveTickets = useMemo(() => {
    if (activeTab !== "active") return [] as GroupedTicket[];

    const groups = new Map<string, TicketResponse[]>();
    for (const ticket of filteredTickets) {
      const key = [
        ticket.orderId,
        ticket.eventId,
        ticket.ticketBatchName,
        ticket.purchasePrice.toFixed(2),
        ticket.eventDate ?? "",
      ].join("|");

      const existing = groups.get(key) ?? [];
      existing.push(ticket);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([key, ticketsInGroup]) => ({
      key,
      representative: ticketsInGroup[0],
      tickets: ticketsInGroup,
      quantity: ticketsInGroup.length,
    }));
  }, [activeTab, filteredTickets]);

  const groupedResaleTickets = useMemo(() => {
    if (activeTab !== "resale") return [] as GroupedTicket[];

    const groups = new Map<string, TicketResponse[]>();
    for (const ticket of filteredTickets) {
      const key = [
        ticket.eventId,
        ticket.ticketBatchName,
        ticket.purchasePrice.toFixed(2),
        ticket.eventDate ?? "",
      ].join("|");

      const existing = groups.get(key) ?? [];
      existing.push(ticket);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([key, ticketsInGroup]) => ({
      key,
      representative: ticketsInGroup[0],
      tickets: ticketsInGroup,
      quantity: ticketsInGroup.length,
    }));
  }, [activeTab, filteredTickets]);

  const filteredSoldListings = normalizedQuery
    ? soldListings.filter((listing) =>
        [
          listing.eventId,
          listing.askingPrice.toString(),
          listing.sellerPayout.toString(),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : soldListings;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-void">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-272 mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold mb-2">My Tickets</h1>
            <p className="text-muted">Manage your tickets and listings</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <SummaryCard value={activeTickets.length} label="Upcoming" />
            <SummaryCard value={resaleTickets.length} label="On The List" />
            <SummaryCard value={resaleTickets.length} label="Active listings" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-bg-surface border border-border rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab("active")}
              className={`cursor-pointer text-sm font-medium px-4 py-2 rounded-md transition-all text-bg ${
                activeTab === "active"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              Active Tickets{" "}
              <span className="ml-1.5 text-xs text-bg/70">
                ({activeTickets.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("resale")}
              className={`cursor-pointer text-sm font-medium px-4 py-2 rounded-md transition-all text-bg ${
                activeTab === "resale"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              <span
                className={activeTab === "resale" ? "text-void" : "text-gold"}
              >
                On The List
              </span>{" "}
              <span className="ml-1.5 text-xs text-bg/70">
                ({resaleTickets.length})
              </span>
            </button>
            {/* <button
              onClick={() => setActiveTab("sold")}
              className={`cursor-pointer text-sm font-medium px-4 py-2 rounded-md transition-all text-bg ${
                activeTab === "sold"
                  ? "bg-gold text-void"
                  : "bg-surface/60 text-cream/90 hover:bg-surface"
              }`}
            >
              History{" "}
              <span className="ml-1.5 text-xs text-bg/70">
                ({soldListings.length})
              </span>
            </button> */}
          </div>

          <div className="relative mb-5 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-cream placeholder:text-muted focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {successMessage && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
              <Check className="h-4 w-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {activeTab === "sold" ? (
            filteredSoldListings.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface/40 p-12 text-center">
                <DollarSign className="mx-auto mb-4 h-12 w-12 text-cream/30" />
                <h2 className="mb-2 text-lg font-semibold text-cream/90">
                  No sold tickets
                </h2>
                <p className="mb-6 text-sm text-cream/60">
                  When your resale tickets are purchased, they&apos;ll appear
                  here with payout details.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSoldListings.map((listing) => (
                  <SoldListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )
          ) : filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface/40 p-12 text-center">
              <Ticket className="mx-auto mb-4 h-12 w-12 text-cream/30" />
              <h2 className="mb-2 text-lg font-semibold text-cream/90">
                {searchQuery
                  ? "No tickets found"
                  : activeTab === "active"
                    ? "No active tickets"
                    : activeTab === "resale"
                      ? "No resale listings"
                      : "No history yet"}
              </h2>
              <p className="mb-6 text-sm text-cream/60">
                {searchQuery
                  ? "Try a different search term."
                  : activeTab === "active"
                    ? "Browse events and purchase tickets to see them here."
                    : activeTab === "resale"
                      ? "List your active tickets for resale."
                      : "Your transferred or used tickets will appear here."}
              </p>
              {activeTab === "active" && !searchQuery && (
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-void transition hover:bg-gold-light"
                >
                  Browse Events <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === "active"
                ? groupedActiveTickets.map((group) => (
                    <GroupedTicketCard
                      key={group.key}
                      group={group}
                      onListManyForResale={(ticketsToList, quantityToList) => {
                        setResaleModal({
                          representative: group.representative,
                          tickets: ticketsToList,
                          quantity: quantityToList,
                        });
                        setResaleAcknowledge(false);
                        setActionError("");
                      }}
                    />
                  ))
                : activeTab === "resale"
                  ? groupedResaleTickets.map((group) => (
                      <GroupedResaleCard
                        key={group.key}
                        group={group}
                        onCancelManyListings={async (ticketsToCancel) => {
                          setSubmitting(true);
                          setActionError("");
                          try {
                            const client = createBrowserClient();
                            for (const ticket of ticketsToCancel) {
                              const listings = await client.getResaleListings(
                                ticket.eventId,
                              );
                              const myListing = listings.data?.find(
                                (l) =>
                                  l.ticketId === ticket.id &&
                                  l.sellerId === user?.id,
                              );
                              if (myListing) {
                                await client.cancelResaleListing(myListing.id);
                              }
                            }
                            setSuccessMessage(
                              ticketsToCancel.length > 1
                                ? `${ticketsToCancel.length} resale listings cancelled successfully!`
                                : "Resale listing cancelled successfully!",
                            );
                            setTimeout(() => setSuccessMessage(""), 5000);
                            fetchTickets();
                          } catch (err: any) {
                            setError(err.message || "Failed to cancel listing");
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      />
                    ))
                  : filteredTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onListForResale={() => {
                          setResaleModal({
                            representative: ticket,
                            tickets: [ticket],
                            quantity: 1,
                          });
                          setResaleAcknowledge(false);
                          setActionError("");
                        }}
                        onGiftTicket={() => {
                          setGiftModal(ticket);
                          setGiftRecipientName("");
                          setGiftAcknowledge(false);
                          setActionError("");
                        }}
                        onCancelListing={() => setCancelConfirm(ticket)}
                      />
                    ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-void p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-cream">
              Cancel Resale Listing?
            </h3>
            <p className="mb-5 text-sm text-cream/60">
              Are you sure you want to cancel the resale listing for{" "}
              <span className="font-medium text-cream/80">
                {cancelConfirm.eventName}
              </span>
              ? The ticket will be moved back to your active tickets.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5"
              >
                Keep Listed
              </button>
              <button
                onClick={() => handleCancelListing(cancelConfirm)}
                className="flex-1 cursor-pointer rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/30"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resale Modal */}
      {resaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-cream">
                Pass it <span className="text-gold">On The List</span>
              </h3>
              <button
                onClick={() => {
                  setResaleModal(null);
                  setResaleAcknowledge(false);
                  setActionError("");
                }}
                className="text-muted transition-colors hover:text-cream"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 space-y-2">
              <div className="flex justify-between text-sm gap-4">
                <span className="text-muted">Event</span>
                <span className="font-medium text-right">
                  {resaleModal.representative.eventName}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-4">
                <span className="text-muted">Tier</span>
                <span className="font-medium capitalize text-right">
                  {resaleModal.representative.ticketBatchName}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-4">
                <span className="text-muted">Quantity</span>
                <span className="font-medium text-right">
                  {resaleModal.quantity}
                </span>
              </div>
            </div>

            <div className="mb-5 space-y-2.5 rounded-xl bg-void/45 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                How the money flows
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Current release price</span>
                <span className="font-medium text-cream">
                  {formatCurrency(resaleModal.representative.currentBatchPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-3">
                <span className="text-muted">
                  Listing fee{" "}
                  <span className="text-xs text-muted/80">
                    (paid by buyer, 7%)
                  </span>
                </span>
                <span className="font-medium text-cream">
                  {formatCurrency(
                    Math.round(
                      resaleModal.representative.currentBatchPrice * 0.07 * 100,
                    ) / 100
                  )}
                </span>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between text-sm">
                <span className="font-medium text-muted">Buyer pays</span>
                <span className="font-semibold text-cream">
                  {formatCurrency(
                    resaleModal.representative.currentBatchPrice +
                      Math.round(
                        resaleModal.representative.currentBatchPrice *
                          0.07 *
                          100,
                      ) /
                        100,
                  )}
                </span>
              </div>

              <div className="my-1 border-t border-border" />

              <div className="flex justify-between text-sm">
                <span className="text-muted">Organiser receives</span>
                <span className="font-medium text-cream">
                  {formatCurrency(
                    Math.max(
                      resaleModal.representative.currentBatchPrice -
                        resaleModal.representative.purchasePrice,
                      0,
                    ),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Your original price back</span>
                <span className="font-medium text-cream">
                  {formatCurrency(resaleModal.representative.purchasePrice)}
                </span>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between text-sm">
                <span className="font-semibold text-gold">You receive</span>
                <span className="font-bold text-gold">
                  {formatCurrency(
                    resaleModal.representative.purchasePrice *
                      resaleModal.quantity,
                  )}
                </span>
              </div>
            </div>

            <p className="mb-5 text-xs leading-relaxed text-muted/80">
              Your ticket is priced at the{" "}
              <strong className="text-muted">current release price</strong> -
              you get your original{" "}
              {formatCurrency(
                resaleModal.representative.purchasePrice * resaleModal.quantity,
              )}{" "}
              back for {resaleModal.quantity} ticket
              {resaleModal.quantity > 1 ? "s" : ""}. The organiser captures the
              rest, same as if you&apos;d bought today.
            </p>

            <div className="mb-3 rounded-lg bg-void/45 p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={resaleAcknowledge}
                  onChange={(e) => {
                    setResaleAcknowledge(e.target.checked);
                    if (e.target.checked) setActionError("");
                  }}
                  className="mt-0.5 accent-gold"
                />
                <span className="text-xs text-muted">
                  I understand that listing my ticket will invalidate my current
                  QR code. If sold, a new QR will be issued to the buyer. I can
                  cancel this listing at any time before it sells.
                </span>
              </label>
            </div>

            {actionError && (
              <p className="mb-4 text-sm text-red-400">{actionError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResaleModal(null);
                  setResaleAcknowledge(false);
                  setActionError("");
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-void/45"
              >
                Cancel
              </button>
              <button
                onClick={handleListForResale}
                disabled={submitting || !resaleAcknowledge}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Pass it On The List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {giftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-cream">
                Gift this ticket
              </h3>
              <button
                onClick={() => {
                  setGiftModal(null);
                  setGiftRecipientName("");
                  setGiftAcknowledge(false);
                  setActionError("");
                }}
                className="text-muted transition-colors hover:text-cream"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 space-y-2">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted">Event</span>
                <span className="text-right font-medium text-cream">
                  {giftModal.eventName}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted">Date</span>
                <span className="text-right font-medium text-cream">
                  {giftModal.eventDate
                    ? new Date(giftModal.eventDate).toLocaleDateString(
                        "en-GB",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted">Tier</span>
                <span className="text-right font-medium capitalize text-cream">
                  {giftModal.ticketBatchName}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted">Paid</span>
                <span className="text-right font-medium text-cream">
                  {formatCurrency(giftModal.purchasePrice)}
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-muted">
                Recipient name
              </label>
              <input
                type="text"
                value={giftRecipientName}
                onChange={(e) => setGiftRecipientName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full rounded-lg border border-border bg-void/45 px-3 py-2.5 text-sm text-cream placeholder:text-muted outline-none transition-colors focus:border-gold/50"
              />
            </div>

            <div className="mb-5 rounded-lg border border-gold/30 bg-gold/5 p-3">
              <p className="text-xs leading-relaxed text-muted">
                <strong className="text-gold">This cannot be undone.</strong>{" "}
                Your QR code will be invalidated and the ticket will be marked
                as gifted. You will not receive a refund.
              </p>
            </div>

            <div className="mb-3 rounded-lg bg-void/45 p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={giftAcknowledge}
                  onChange={(e) => {
                    setGiftAcknowledge(e.target.checked);
                    if (e.target.checked) setActionError("");
                  }}
                  className="mt-0.5 accent-gold"
                />
                <span className="text-xs text-muted">
                  I understand this gift is irreversible and I will no longer be
                  able to use this ticket.
                </span>
              </label>
            </div>

            {actionError && (
              <p className="mb-4 text-sm text-red-400">{actionError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setGiftModal(null);
                  setGiftRecipientName("");
                  setGiftAcknowledge(false);
                  setActionError("");
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-void/45"
              >
                Cancel
              </button>
              <button
                onClick={handleGiftTicket}
                disabled={
                  giftSubmitting ||
                  !giftAcknowledge ||
                  !giftRecipientName.trim()
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                {giftSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Gift ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildBundleQrToken(ticket: TicketResponse) {
  return [
    "bundle",
    "v1",
    ticket.orderId,
    ticket.eventId,
    ticket.userId,
    encodeURIComponent(ticket.ticketBatchName),
  ].join(":");
}

function safeFilenamePart(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function formatCurrency(amount: number) {
  const currency = process.env.NEXT_PUBLIC_APP_CURRENCY || "GBP";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function downloadQrImage(qrUrl: string, filename: string) {
  try {
    const res = await fetch(qrUrl);
    if (!res.ok) throw new Error("Failed to fetch QR image");

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(qrUrl, "_blank", "noopener,noreferrer");
  }
}

function GroupedTicketCard({
  group,
  onListManyForResale,
}: {
  group: GroupedTicket;
  onListManyForResale: (tickets: TicketResponse[], quantity: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [listQuantity, setListQuantity] = useState(1);
  const [showBundleQr, setShowBundleQr] = useState(false);
  const ticket = group.representative;
  const eligibleTickets = group.tickets.filter(
    (t) => t.allowResale && t.status === "active",
  );
  const maxListable = eligibleTickets.length;
  const bundleQrCode = buildBundleQrToken(ticket);
  const bundleQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(bundleQrCode)}`;
  const bundleQrUrlLarge = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(bundleQrCode)}`;
  const handleDownloadBundleQr = () =>
    downloadQrImage(
      bundleQrUrlLarge,
      `ticket-bundle-${ticket.orderId.slice(-8)}-${safeFilenamePart(ticket.ticketBatchName)}.png`,
    );
  const venue = [ticket.venueName, ticket.city].filter(Boolean).join(", ");
  const dateStr = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  useEffect(() => {
    setListQuantity((current) =>
      Math.min(Math.max(current, 1), maxListable || 1),
    );
  }, [maxListable]);

  return (
    <div className="relative isolate rounded-3xl">
      <div className="pointer-events-none absolute inset-x-2 top-2 h-full rounded-3xl " />
      <div className="pointer-events-none absolute inset-x-4 top-4 h-full rounded-3xl backdrop-blur-[1px]" />

      <div className="relative rounded-3xl border border-white/20 bg-white/10 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div
          className="flex cursor-pointer items-start justify-between gap-3"
          onClick={() => setExpanded((v) => !v)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpanded((v) => !v);
            }
          }}
        >
          <div className="min-w-0">
            <p className="font-serif text-xl font-semibold text-cream">
              {ticket.eventName}
            </p>
            {venue && <p className="mt-1 text-sm text-cream/70">{venue}</p>}
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-cream/70">
              <span>{dateStr}</span>
              <span className="capitalize">{ticket.ticketBatchName}</span>
              <span>{formatCurrency(ticket.purchasePrice)} each</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowBundleQr(true);
              }}
              className="hidden rounded-lg border border-white/15 bg-white/5 p-1.5 transition hover:border-gold/40 hover:bg-gold/10 sm:block"
              aria-label="View bundle QR code"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded bg-white p-0.5">
                <Image
                  src={bundleQrUrl}
                  alt="Bundle QR"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </button>
            <span className="rounded-full border border-gold/40 bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
              x{group.quantity}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-cream/70 transition-transform ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-white/15 pt-4">
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/12 bg-white/8 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBundleQr(true)}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white p-1.5 transition hover:ring-2 hover:ring-gold/40"
                  aria-label="View bundle QR code"
                >
                  <Image
                    src={bundleQrUrl}
                    alt="Bundle QR"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </button>
                <div>
                  <p className="text-sm font-semibold text-cream">
                    Entry QR for {group.quantity} ticket
                    {group.quantity === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-cream/55">
                    Scan once at the door to validate the current active tickets
                    in this order.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBundleQr(true)}
                  className="rounded-lg border border-gold/35 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
                >
                  View QR
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBundleQr}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-cream/80 transition hover:bg-white/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream/60">
              Individual Tickets
            </p>

            {maxListable > 0 && (
              <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-gold/20 bg-gold/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-cream/75">
                  Pass it{" "}
                  <span className="font-semibold text-gold">On The List</span> (
                  {maxListable} available)
                </div>
                <div className="flex w-full min-w-0 items-center gap-1.5 sm:ml-auto sm:w-auto sm:gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setListQuantity((v) => Math.max(1, v - 1));
                    }}
                    className="h-6 w-6 shrink-0 rounded-md border border-white/20 text-sm text-cream/80 transition-colors hover:bg-white/10 sm:h-7 sm:w-7"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-5 shrink-0 text-center text-sm font-semibold text-gold sm:w-8">
                    {listQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setListQuantity((v) => Math.min(maxListable, v + 1));
                    }}
                    className="h-6 w-6 shrink-0 rounded-md border border-white/20 text-sm text-cream/80 transition-colors hover:bg-white/10 sm:h-7 sm:w-7"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onListManyForResale(eligibleTickets, listQuantity);
                    }}
                    className="ml-auto rounded-lg border border-gold/35 bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold whitespace-nowrap transition-colors hover:bg-gold/20 sm:px-3 sm:text-xs"
                  >
                    Pass it on The List
                  </button>
                </div>
              </div>
            )}
            {/* 
            <div className="space-y-2">
              {group.tickets.map((t, idx) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-white/12 bg-white/8 px-3 py-3 backdrop-blur-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cream">
                        Ticket #{idx + 1}
                      </p>
                      <p className="truncate text-xs font-mono text-cream/55">
                        {t.qrCode}
                      </p>
                    </div>

                    {t.allowResale && t.status === "active" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onListManyForResale([t], 1);
                        }}
                        className="shrink-0 rounded-lg border border-gold/30 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
                      >
                        Pass it on The List
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div> */}
          </div>
        )}
      </div>

      {showBundleQr &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowBundleQr(false)}
          >
            <div
              className="relative w-full max-w-sm rounded-2xl border border-border bg-void p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowBundleQr(false)}
                className="absolute right-4 top-4 cursor-pointer text-cream/60 hover:text-cream"
                aria-label="Close QR modal"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="mb-1 text-center text-lg font-semibold text-cream">
                Entry QR
              </h3>
              <p className="mb-4 text-center text-sm text-cream/60">
                {ticket.eventName} · {group.quantity} ticket
                {group.quantity === 1 ? "" : "s"}
              </p>
              <div className="mx-auto h-64 w-64 overflow-hidden rounded-xl border border-border bg-white p-2">
                <div className="relative h-full w-full">
                  <Image
                    src={bundleQrUrlLarge}
                    alt="Bundle ticket QR code"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="mt-3 break-all text-center font-mono text-[10px] text-cream/45">
                {bundleQrCode}
              </p>
              <button
                type="button"
                onClick={handleDownloadBundleQr}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/35 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20"
              >
                <Download className="h-4 w-4" />
                Download QR
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function GroupedResaleCard({
  group,
  onCancelManyListings,
}: {
  group: GroupedTicket;
  onCancelManyListings: (tickets: TicketResponse[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cancelQuantity, setCancelQuantity] = useState(1);
  const ticket = group.representative;
  const venue = [ticket.venueName, ticket.city].filter(Boolean).join(", ");
  const dateStr = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  useEffect(() => {
    setCancelQuantity((current) =>
      Math.min(Math.max(current, 1), group.quantity),
    );
  }, [group.quantity]);

  return (
    <div className="relative isolate rounded-3xl">
      <div className="pointer-events-none absolute inset-x-2 top-2 h-full rounded-3xl" />
      <div className="pointer-events-none absolute inset-x-4 top-4 h-full rounded-3xl backdrop-blur-[1px]" />

      <div className="relative rounded-3xl border border-white/20 bg-white/10 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div
          className="flex cursor-pointer items-start justify-between gap-3"
          onClick={() => setExpanded((v) => !v)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpanded((v) => !v);
            }
          }}
        >
          <div className="min-w-0">
            <p className="font-serif text-xl font-semibold text-cream">
              {ticket.eventName}
            </p>
            {venue && <p className="mt-1 text-sm text-cream/70">{venue}</p>}
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-cream/70">
              <span>{dateStr}</span>
              <span className="capitalize">{ticket.ticketBatchName}</span>
              <span>{formatCurrency(ticket.purchasePrice)} each</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-gold/40 bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
              x{group.quantity}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-cream/70 transition-transform ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-white/15 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream/60">
              Individual Listings
            </p>

            <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-gold/20 bg-gold/5 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-cream/75">
                Cancel{" "}
                <span className="font-semibold text-gold">On The List</span>{" "}
                listing ({group.quantity} available)
              </div>
              <div className="flex w-full min-w-0 items-center gap-1.5 sm:ml-auto sm:w-auto sm:gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCancelQuantity((value) => Math.max(1, value - 1));
                  }}
                  className="h-6 w-6 shrink-0 rounded-md border border-white/20 text-sm text-cream/80 transition-colors hover:bg-white/10 sm:h-7 sm:w-7"
                  aria-label="Decrease cancel quantity"
                >
                  -
                </button>
                <span className="w-5 shrink-0 text-center text-sm font-semibold text-gold sm:w-8">
                  {cancelQuantity}
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCancelQuantity((value) =>
                      Math.min(group.quantity, value + 1),
                    );
                  }}
                  className="h-6 w-6 shrink-0 rounded-md border border-white/20 text-sm text-cream/80 transition-colors hover:bg-white/10 sm:h-7 sm:w-7"
                  aria-label="Increase cancel quantity"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCancelManyListings(
                      group.tickets.slice(0, cancelQuantity),
                    );
                  }}
                  className="ml-auto rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Cancel {cancelQuantity}{" "}
                  {cancelQuantity === 1 ? "Listing" : "Listings"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <p className="font-serif text-2xl font-bold text-gold">{value}</p>
      <p className="text-[#6B665C] text-xs mt-1">{label}</p>
    </div>
  );
}

function TicketCard({
  ticket,
  onListForResale,
  onGiftTicket,
  onCancelListing,
}: {
  ticket: TicketResponse;
  onListForResale: () => void;
  onGiftTicket: () => void;
  onCancelListing: () => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.qrCode)}`;
  const qrUrlLarge = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.qrCode)}`;
  const handleDownloadQr = async () => {
    const filename = `ticket-qr-${ticket.qrCode.slice(0, 12)}.png`;
    await downloadQrImage(qrUrlLarge, filename);
  };
  const venue = [ticket.venueName, ticket.city].filter(Boolean).join(", ");
  const dateStr = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-5 hover:border-gold/20 transition-colors">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="inline-flex flex-col items-center gap-1.5">
              <button
                onClick={() => setShowQr(true)}
                className="group relative inline-block h-29 w-29 overflow-hidden rounded-lg bg-white p-2 transition hover:border-gold/50"
              >
                <div className="relative h-full w-full rounded">
                  <Image
                    src={qrUrl}
                    alt="Ticket QR"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
                </div>
              </button>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="text-[10px] text-muted hover:text-gold transition-colors flex items-center gap-1"
              >
                <Download className="h-2.5 w-2.5" />
                Save QR
              </button>
            </div>
            <span className="text-muted text-[10px] font-mono">
              {ticket.qrCode.slice(0, 12)}...
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/events/${ticket.eventId}`}
                  className="font-serif text-lg font-semibold hover:text-gold transition-colors"
                >
                  {ticket.eventName}
                </Link>
                {venue && <p className="text-muted text-sm mt-0.5">{venue}</p>}
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap ${
                  ticket.status === "active"
                    ? "text-emerald-400 bg-emerald-500/10"
                    : ticket.status === "listed"
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-cream/60 bg-cream/10"
                }`}
              >
                {ticket.status === "active" ? "Valid" : ticket.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted">
              <span>{dateStr}</span>
              <span className="capitalize">{ticket.ticketBatchName}</span>
              <span>{formatCurrency(ticket.purchasePrice)}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {ticket.status === "active" && ticket.allowResale && (
                <button
                  onClick={onListForResale}
                  className="border border-gold/30 text-muted text-sm font-medium px-4 py-2 rounded-lg hover:bg-gold/10 transition-colors"
                >
                  Pass it <span className="text-gold">On The List</span>
                </button>
              )}
              {/* {ticket.status === "active" && (
                  <button
                    type="button"
                    onClick={onGiftTicket}
                    className="border border-border text-muted text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#222222] transition-colors flex items-center gap-2"
                  >
                    <Gift className="h-3.25 w-3.25" />
                    Gift
                  </button>
                )} */}
              {ticket.status === "listed" && (
                <button
                  onClick={onCancelListing}
                  className="border border-red-500/30 text-red-400 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Cancel Listing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-border bg-void p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQr(false)}
              className="absolute right-4 top-4 cursor-pointer text-cream/60 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-1 text-center text-lg font-semibold text-cream">
              Your Ticket QR Code
            </h3>
            <p className="mb-4 text-center text-sm text-cream/60">
              {ticket.eventName}
            </p>
            <div className="mx-auto h-64 w-64 overflow-hidden rounded-xl border border-border bg-white p-2">
              <div className="relative h-full w-full">
                <Image
                  src={qrUrlLarge}
                  alt="Ticket QR Code"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </div>
            <p className="mt-3 text-center font-mono text-xs text-cream/50">
              {ticket.qrCode}
            </p>
            <p className="mt-1 text-center text-xs text-cream/40">
              {ticket.ticketBatchName} - {formatCurrency(ticket.purchasePrice)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SoldListingCard({ listing }: { listing: ResaleListingResponse }) {
  const soldDate = listing.updatedAt
    ? new Date(listing.updatedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const refundLabel =
    listing.sellerRefundStatus === "succeeded"
      ? "Refunded"
      : listing.sellerRefundStatus === "pending"
        ? "Processing"
        : listing.sellerRefundStatus === "failed"
          ? "Refund Failed"
          : "Pending";

  const refundColor =
    listing.sellerRefundStatus === "succeeded"
      ? "bg-emerald-500/20 text-emerald-400"
      : listing.sellerRefundStatus === "pending"
        ? "bg-amber-500/20 text-amber-400"
        : listing.sellerRefundStatus === "failed"
          ? "bg-red-500/20 text-red-400"
          : "bg-cream/10 text-cream/60";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5">
      <div className="absolute right-4 top-4">
        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
          Sold
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <Link
            href={`/events/${listing.eventId}`}
            className="text-base font-semibold text-cream transition hover:text-gold"
          >
            Event #{listing.eventId.slice(-6)}
          </Link>
          {soldDate && (
            <p className="mt-0.5 text-sm text-cream/60">Sold on {soldDate}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-void/50 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-cream/50">Sale Price</p>
              <p className="font-semibold text-cream">
                {formatCurrency(listing.askingPrice)}
              </p>
            </div>
            <div>
              <p className="text-cream/50">Original Price</p>
              <p className="font-semibold text-cream">
                {formatCurrency(listing.originalPurchasePrice)}
              </p>
            </div>
            <div>
              <p className="text-cream/50">Your Payout</p>
              <p className="font-semibold text-emerald-400">
                {formatCurrency(listing.sellerPayout)}
              </p>
            </div>
            <div>
              <p className="text-cream/50">Payout Status</p>
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${refundColor}`}
              >
                {refundLabel}
              </span>
            </div>
          </div>
        </div>

        {listing.sellerRefundStatus === "succeeded" && (
          <p className="text-xs text-cream/40">
            Refund sent to your original payment method. It may take 5–10
            business days to appear.
          </p>
        )}
        {listing.sellerRefundStatus === "failed" && (
          <p className="text-xs text-red-400/80">
            The automatic refund could not be processed. Please contact support
            for assistance.
          </p>
        )}
      </div>
    </div>
  );
}
