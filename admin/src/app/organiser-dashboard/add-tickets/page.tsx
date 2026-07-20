"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { TicketGroupsPanel } from "@/components/organiser/tickets/TicketGroupsPanel";
import {
  TICKET_TEMPLATES,
  cloneGroups,
} from "@/components/organiser/tickets/ticketTemplates";
import { useTicketGroups } from "@/components/organiser/tickets/useTicketGroups";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import {
  clearEventDraft,
  loadEventDraft,
  loadTicketDraft,
  parseTierCutoff,
  saveTicketDraft,
  type EventDraft,
} from "@/lib/eventDraft";
import { EVENT_CATEGORIES } from "@/lib/shared";
import type { CreateEventInput } from "@/lib/shared";
import { organiserPaths } from "@/lib/organiserPaths";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const [header, data] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}

export default function AddTicketsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [draftEvent, setDraftEvent] = useState<EventDraft | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    groups,
    setGroups,
    activeGroupId,
    setActiveGroupId,
    addGroup,
    deleteGroup,
    addTier,
    deleteTier,
    updateTier,
    duplicateTier,
    moveTier,
  } = useTicketGroups([]);

  useEffect(() => {
    const draft = loadEventDraft();
    if (!draft) {
      router.replace(organiserPaths.createEvent);
      return;
    }
    setDraftEvent(draft);

    const ticketDraft = loadTicketDraft();
    if (ticketDraft?.groups?.length) {
      setGroups(ticketDraft.groups);
      setSelectedTemplate(ticketDraft.templateKey);
      setActiveGroupId(ticketDraft.groups[0]?.id ?? null);
    }
  }, [router, setActiveGroupId, setGroups]);

  useEffect(() => {
    if (!selectedTemplate && groups.length === 0) return;
    saveTicketDraft({ templateKey: selectedTemplate, groups });
  }, [groups, selectedTemplate]);

  const eventName = draftEvent?.eventName || "Your Event Name";
  const eventVenue = draftEvent?.venueName || "Venue";
  const eventCity = draftEvent?.city || "";
  const eventDate = draftEvent?.startDate || "";
  const eventImage =
    draftEvent?.imagePreview ||
    (draftEvent?.eventImageUrl?.startsWith("/uploads/")
      ? `${API_URL}${draftEvent.eventImageUrl}`
      : draftEvent?.eventImageUrl) ||
    "";

  const selectTemplate = (key: string) => {
    const cloned = cloneGroups(TICKET_TEMPLATES[key].groups);
    setGroups(cloned);
    setSelectedTemplate(key);
    setActiveGroupId(cloned[0]?.id ?? null);
  };

  const resolveEventImage = useCallback(async (): Promise<string> => {
    if (draftEvent?.eventImageUrl) return draftEvent.eventImageUrl;
    if (draftEvent?.imagePreview?.startsWith("data:") && token) {
      const file = dataUrlToFile(draftEvent.imagePreview, "event-image.png");
      if (file) {
        const client = createApiClient(token);
        const res = await client.uploadImage(file);
        if (res.ok && res.data) return res.data.url;
      }
    }
    return `placeholder-${Date.now()}`;
  }, [draftEvent, token]);

  const handleSubmit = async (status: "draft" | "published") => {
    if (!draftEvent || !token) return;
    setError(null);

    if (!selectedTemplate || groups.length === 0) {
      setError("Choose a template and configure at least one ticket tier.");
      return;
    }

    for (const group of groups) {
      for (const tier of group.tiers) {
        if (!tier.name.trim()) {
          setError("Every tier needs a name.");
          return;
        }
        if ((Number(tier.quantity) || 0) < 1) {
          setError(`Quantity for "${tier.name}" must be at least 1.`);
          return;
        }
        if ((Number(tier.price) || 0) <= 0) {
          setError(`Price for "${tier.name}" must be greater than 0.`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const eventImage = await resolveEventImage();
      const totalTickets = groups.reduce(
        (sum, g) =>
          sum + g.tiers.reduce((s, t) => s + (Number(t.quantity) || 0), 0),
        0,
      );

      const input: CreateEventInput = {
        eventName: draftEvent.eventName.trim(),
        eventDescription: draftEvent.description.trim(),
        eventCategory: EVENT_CATEGORIES[0],
        eventImage,
        venueName: draftEvent.venueName.trim(),
        addressLine: draftEvent.venueAddress.trim(),
        city: draftEvent.city.trim(),
        postcode: draftEvent.postCode.trim() || "—",
        country: "United Kingdom",
        mapsLink: draftEvent.mapsLink?.trim() || undefined,
        eventDate: draftEvent.startDate,
        eventEndDate: draftEvent.endDate || draftEvent.startDate,
        startTime: draftEvent.startTime,
        endTime: draftEvent.endTime,
        lastEntryTime: draftEvent.lastEntry?.trim() || undefined,
        ageRestriction: draftEvent.ageRestriction?.trim() || undefined,
        totalTickets,
        ticketGroups: groups.map((g, idx) => ({
          title: g.name.trim() || `Group ${idx + 1}`,
          sortOrder: idx,
          batches: g.tiers.map((t) => ({
            name: t.name.trim(),
            quantity: Math.max(0, Number(t.quantity) || 0),
            basePrice: Math.max(0, Number(t.price) || 0),
            minDiscount: 0,
            maxDiscount: 0,
            entryWindowCutoff: parseTierCutoff(t.cutoff),
          })),
        })),
        ticketBatches: [],
        dynamicPricing: false,
        allowResale: true,
        platformCommission: 5,
        status,
      };

      const client = createApiClient(token);
      const res = await client.createEvent(input);
      if (res.ok) {
        clearEventDraft();
        router.push(organiserPaths.events);
      } else {
        setError(res.message || "Failed to create event");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  if (!draftEvent) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-1 items-center justify-center p-10 font-sans text-[#888888]">
          Loading…
        </div>
      </AuthenticatedLayout>
    );
  }

  const hasPreviewContent =
    groups.length > 0 && groups.some((g) => g.tiers.some((t) => t.name && t.price));

  return (
    <AuthenticatedLayout>
      <div className="relative z-[1] flex min-h-full flex-1 flex-col">
        <div className="px-12 pt-6 pb-0">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push(organiserPaths.createEvent)}
                className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 font-sans text-[13px] text-[#888888] hover:text-cream"
              >
                ← Back to Event
              </button>
              <h1 className="mt-2.5 mb-1.5 font-serif text-[32px] font-bold text-cream">
                Add Tickets
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="self-center cursor-pointer rounded-md border border-[#222222] bg-transparent px-[18px] py-2 font-sans text-[13px] text-gold"
            >
              Preview →
            </button>
          </div>
        </div>

        <div className="mb-9 px-12">
          <div className="mb-2.5 font-sans text-[11px] tracking-[0.1em] text-[#888888] uppercase">
            Choose a Template
          </div>
          <div className="flex flex-wrap gap-[15px]">
            {Object.keys(TICKET_TEMPLATES).map((key) => (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => selectTemplate(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") selectTemplate(key);
                }}
                className="flex min-w-[200px] flex-1 cursor-pointer flex-row items-center gap-3.5 rounded-[10px] p-[14px_18px] transition-shadow duration-150"
                style={{
                  boxShadow:
                    selectedTemplate === key
                      ? "inset 0 0 0 1px rgba(201,168,76,0.5), 0 0 12px rgba(201,168,76,0.12)"
                      : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <TemplateIcon templateKey={key} />
                <div className="flex flex-col gap-0.5">
                  <div className="font-sans text-sm font-semibold text-cream">
                    {TICKET_TEMPLATES[key].label}
                  </div>
                  <div className="font-sans text-xs leading-normal text-[#888888]">
                    {TICKET_TEMPLATES[key].desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTemplate && (
          <div className="mb-5 flex justify-end px-12">
            <button
              type="button"
              onClick={() => {
                setSelectedTemplate(null);
                setGroups([]);
              }}
              className="cursor-pointer border-none bg-transparent p-0 font-sans text-[13px] text-gold hover:underline"
            >
              Change template
            </button>
          </div>
        )}

        {selectedTemplate && (
          <div className="flex-1 px-12 pb-20">
            <TicketGroupsPanel
              groups={groups}
              activeGroupId={activeGroupId}
              setActiveGroupId={setActiveGroupId}
              addGroup={addGroup}
              deleteGroup={deleteGroup}
              addTier={addTier}
              deleteTier={deleteTier}
              updateTier={updateTier}
              duplicateTier={duplicateTier}
              moveTier={moveTier}
            />
          </div>
        )}

        {error && (
          <div className="mx-12 mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-sans text-[13px] text-rose-200">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-[#1A1A1A] bg-void px-12 py-4">
          <button
            type="button"
            onClick={() => router.push(organiserPaths.createEvent)}
            className="cursor-pointer border-none bg-transparent px-5 py-2.5 font-sans text-[13px] text-[#888888] hover:text-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("published")}
            className="cursor-pointer border-none bg-gold px-6 py-2.5 font-sans text-[13px] font-semibold text-void hover:bg-[#D4B862] disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Add to event"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-[6px]"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative max-h-[85vh] w-[760px] overflow-y-auto rounded-[14px] border border-[#222222] bg-[#111111]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-h-0">
              <div className="w-[300px] shrink-0 rounded-l-[14px] border-r border-[#1E1E1E] bg-[#0D0D0D] p-8">
                {eventImage && (
                  <div className="mb-4 h-[140px] overflow-hidden rounded-[10px] bg-[#1A1A1A]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={eventImage}
                      alt="Event"
                      className="block h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="mb-5 font-sans text-[10px] tracking-[0.15em] text-gold uppercase">
                  Preview
                </div>
                <div className="mb-2 font-serif text-[22px] font-bold text-cream">
                  {eventName}
                </div>
                <p className="mb-1.5 font-sans text-xs text-[#888888]">
                  {[eventVenue, eventCity, eventDate].filter(Boolean).join(" · ")}
                </p>
                <div className="my-5 border-t border-[#1E1E1E]" />
                <div className="mb-2.5 font-sans text-[10px] tracking-[0.12em] text-gold uppercase">
                  Your Category
                </div>
                <p className="m-0 font-sans text-[13px] leading-relaxed text-[#888888]/70">
                  {draftEvent.description ||
                    "Your event description will appear here once added in the event details step."}
                </p>
              </div>

              <div className="relative flex-1 overflow-y-auto rounded-r-[14px] p-8">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="absolute top-4 right-4 cursor-pointer border-none bg-transparent text-lg text-[#555555]"
                >
                  ✕
                </button>

                {!hasPreviewContent ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#444444"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <div className="font-sans text-[13px] leading-relaxed text-[#555555]">
                      Add at least one tier with a name and price
                      <br />
                      to see the buyer view.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 font-sans text-[11px] tracking-[0.14em] text-gold uppercase">
                      Select Tickets
                    </div>
                    {groups.map((group, i) => (
                      <div key={group.id}>
                        {groups.length > 1 && (
                          <div
                            className="mb-2.5 font-sans text-[10px] tracking-[0.1em] text-[#555555] uppercase"
                            style={{ marginTop: i > 0 ? 20 : 0 }}
                          >
                            {group.name}
                          </div>
                        )}
                        {group.tiers.map((tier, j) => {
                          const isLast =
                            j === group.tiers.length - 1 && i === groups.length - 1;
                          return (
                            <div
                              key={tier.id}
                              className="flex items-start justify-between"
                              style={{
                                borderBottom: isLast ? "none" : "1px solid #2A2A2A",
                                paddingBottom: isLast ? 0 : 16,
                                marginBottom: isLast ? 0 : 16,
                              }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <div className="font-sans text-sm font-semibold text-cream">
                                  {tier.name || "Unnamed Tier"}
                                </div>
                                <div className="font-sans text-xs text-[#888888]">
                                  {tier.price
                                    ? `+ £${(parseFloat(tier.price) * 0.07).toFixed(2)} booking fee`
                                    : "+ booking fee"}
                                </div>
                                <div className="font-sans text-xs text-[#4CAF74]">Available</div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="font-serif text-xl font-bold text-cream">
                                  {tier.price
                                    ? `£${parseFloat(tier.price).toFixed(2)}`
                                    : "£—"}
                                </div>
                                <div className="flex h-8 items-center overflow-hidden rounded-md border border-[#2A2A2A]">
                                  <button
                                    type="button"
                                    className="h-8 w-[30px] border-none border-r border-[#2A2A2A] bg-transparent text-base text-[#888888]"
                                  >
                                    −
                                  </button>
                                  <div className="flex h-8 w-[30px] items-center justify-center font-sans text-[13px] font-semibold text-[#888888]">
                                    0
                                  </div>
                                  <button
                                    type="button"
                                    className="h-8 w-[30px] border-none border-l border-[#2A2A2A] bg-transparent text-base text-[#888888]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div className="my-5 border-t border-[#2A2A2A]" />
                    <div className="mb-3.5 font-sans text-xs text-[#888888]">
                      You can always list your ticket for resale.
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-lg border-none bg-[#2A2A2A] py-3 font-sans text-[13px] font-bold tracking-[0.1em] text-[#555555] uppercase"
                    >
                      Select Tickets Above
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

function TemplateIcon({ templateKey }: { templateKey: string }) {
  const props = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "#C9A84C",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (templateKey === "general") {
    return (
      <svg {...props}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  if (templateKey === "vip") {
    return (
      <svg {...props}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (templateKey === "malefemale") {
    return (
      <svg {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
