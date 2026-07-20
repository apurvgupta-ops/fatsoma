"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import {
  EMPTY_EVENT_DRAFT,
  loadEventDraft,
  type EventDraft,
  type EventDraftForm,
  saveEventDraft,
} from "@/lib/eventDraft";
import { organiserPaths } from "@/lib/organiserPaths";
import {
  OtlBackIcon,
  OtlFlatInput,
  OtlFlatSelect,
  OtlFlatTextarea,
  OtlHelp,
  OtlIconBuilding,
  OtlIconCalendar,
  OtlIconClock,
  OtlIconHash,
  OtlIconLink,
  OtlIconMapPin,
  OtlIconPerson,
  OtlLabel,
  OtlSectionHead,
} from "@/components/organiser/OtlFormPrimitives";

type Props = {
  onBack?: () => void;
};

export function CreateEventPanel({ onBack }: Props) {
  const router = useRouter();
  const { token } = useAuth();
  const [form, setForm] = useState<EventDraftForm>(EMPTY_EVENT_DRAFT);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [backHover, setBackHover] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadEventDraft();
    if (!saved) return;
    setForm({
      eventName: saved.eventName ?? "",
      description: saved.description ?? "",
      startDate: saved.startDate ?? "",
      endDate: saved.endDate ?? "",
      startTime: saved.startTime ?? "",
      endTime: saved.endTime ?? "",
      lastEntry: saved.lastEntry ?? "",
      ageRestriction: saved.ageRestriction ?? "",
      venueName: saved.venueName ?? "",
      venueAddress: saved.venueAddress ?? "",
      city: saved.city ?? "",
      postCode: saved.postCode ?? "",
      mapsLink: saved.mapsLink ?? "",
    });
    if (saved.imagePreview) setImagePreview(saved.imagePreview);
  }, []);

  const set =
    (key: keyof EventDraftForm) => (value: string) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else router.push(organiserPaths.events);
  };

  const handleContinue = useCallback(async () => {
    setError(null);
    if (!form.eventName.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!form.description.trim()) {
      setError("Event description is required.");
      return;
    }
    if (!form.startDate) {
      setError("Event start date is required.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setError("Start and end times are required.");
      return;
    }
    if (!form.venueName.trim() || !form.venueAddress.trim() || !form.city.trim()) {
      setError("Venue name, address, and city are required.");
      return;
    }

    setContinuing(true);
    try {
      let eventImageUrl: string | undefined;
      let preview = imagePreview ?? undefined;

      if (imageFile && token) {
        const client = createApiClient(token);
        const res = await client.uploadImage(imageFile);
        if (res.ok && res.data) {
          eventImageUrl = res.data.url;
        }
      } else if (imagePreview?.startsWith("data:")) {
        preview = imagePreview;
      }

      const draft: EventDraft = {
        ...form,
        endDate: form.endDate || form.startDate,
        postCode: form.postCode || "—",
        eventImageUrl,
        imagePreview: preview,
      };
      saveEventDraft(draft);
      router.push(organiserPaths.addTickets);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not continue");
    } finally {
      setContinuing(false);
    }
  }, [form, imageFile, imagePreview, router, token]);

  return (
    <div className="relative z-[1] flex min-h-full flex-1 flex-col px-10 pt-7 pb-0">
      <div className="mb-5">
        <button
          type="button"
          onClick={handleBack}
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
          className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 font-sans text-[13px] transition-colors duration-150"
          style={{ color: backHover ? "#F5F0E8" : "#888888" }}
        >
          <OtlBackIcon />
          Back to Events
        </button>
      </div>

      <div className="mb-6">
        <h1 className="m-0 mb-1 font-sans text-[26px] font-bold text-cream">
          Create New Event
        </h1>
        <p className="m-0 font-sans text-[13px] text-[#888888]">
          Fill in the details below to create your event.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 pb-20">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <OtlSectionHead>Event Details</OtlSectionHead>
            <div className="mb-3">
              <OtlLabel>Event Name</OtlLabel>
              <OtlFlatInput
                icon={<OtlIconCalendar />}
                value={form.eventName}
                onChange={set("eventName")}
                placeholder="Enter event name"
              />
            </div>
            <div>
              <OtlLabel>Event Description</OtlLabel>
              <OtlFlatTextarea
                value={form.description}
                onChange={set("description")}
              />
            </div>
            <div className="mt-3.5">
              <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
                Event Image
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => document.getElementById("event-image-input")?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    document.getElementById("event-image-input")?.click();
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-md border border-dashed border-[#333333] transition-colors duration-150 hover:border-gold"
              >
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="block h-40 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full border-none bg-black/70 text-sm text-cream"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5 px-5 py-7">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#555555"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="font-sans text-[13px] text-[#555555]">
                      Click to upload event image
                    </span>
                    <span className="font-sans text-[11px] text-[#3A3A3A]">
                      PNG, JPG, WEBP · Max 5MB
                    </span>
                  </div>
                )}
              </div>
              <input
                id="event-image-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div>
            <OtlSectionHead>Date &amp; Time</OtlSectionHead>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <OtlLabel>Event Start Date</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconCalendar />}
                  type="date"
                  value={form.startDate}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      startDate: v,
                      endDate: !prev.endDate || prev.endDate < v ? v : prev.endDate,
                    }))
                  }
                  placeholder="Select start date"
                />
              </div>
              <div>
                <OtlLabel>Event End Date</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconCalendar />}
                  type="date"
                  value={form.endDate}
                  onChange={set("endDate")}
                  placeholder="Select end date"
                />
              </div>
              <div>
                <OtlLabel>Start Time</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconClock />}
                  type="time"
                  value={form.startTime}
                  onChange={set("startTime")}
                  placeholder="Select start time"
                />
              </div>
              <div>
                <OtlLabel>End Time</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconClock />}
                  type="time"
                  value={form.endTime}
                  onChange={set("endTime")}
                  placeholder="Select end time"
                />
              </div>
              <div className="col-span-2">
                <OtlLabel>Last Entry Time</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconClock />}
                  type="time"
                  value={form.lastEntry}
                  onChange={set("lastEntry")}
                  placeholder="Select last entry time"
                />
                <OtlHelp>The latest time attendees can enter the venue.</OtlHelp>
              </div>
              <div className="col-span-2">
                <OtlLabel>Age Restriction</OtlLabel>
                <OtlFlatSelect
                  icon={<OtlIconPerson />}
                  value={form.ageRestriction}
                  onChange={set("ageRestriction")}
                >
                  <option value="">Select age restriction</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                  <option value="none">No restriction</option>
                </OtlFlatSelect>
                <OtlHelp>Minimum age required to attend.</OtlHelp>
              </div>
            </div>
          </div>
        </div>

        <div>
          <OtlSectionHead>Venue</OtlSectionHead>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <div>
                <OtlLabel>Venue Name</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconMapPin />}
                  value={form.venueName}
                  onChange={set("venueName")}
                  placeholder="Enter venue name"
                />
              </div>
              <div>
                <OtlLabel>Venue Address</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconMapPin />}
                  value={form.venueAddress}
                  onChange={set("venueAddress")}
                  placeholder="Enter full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <OtlLabel>City</OtlLabel>
                  <OtlFlatInput
                    icon={<OtlIconBuilding />}
                    value={form.city}
                    onChange={set("city")}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <OtlLabel>Post Code</OtlLabel>
                  <OtlFlatInput
                    icon={<OtlIconHash />}
                    value={form.postCode}
                    onChange={set("postCode")}
                    placeholder="Enter post code"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div>
                <OtlLabel>Google Maps Link</OtlLabel>
                <OtlFlatInput
                  icon={<OtlIconLink />}
                  value={form.mapsLink}
                  onChange={set("mapsLink")}
                  placeholder="https://maps.google.com/..."
                />
                <OtlHelp>
                  Add a Google Maps link to help attendees find the venue easily.
                </OtlHelp>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-sans text-[13px] text-rose-200">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-10 mt-auto flex justify-end gap-3 border-t border-[#1A1A1A] bg-void px-10 py-3.5">
        <button
          type="button"
          onClick={handleBack}
          className="cursor-pointer border-none bg-transparent px-[18px] py-2.5 font-sans text-[13px] text-[#888888] transition-colors duration-150 hover:text-cream"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={continuing}
          onClick={handleContinue}
          className="cursor-pointer border-none bg-gold px-[22px] py-2.5 font-sans text-[13px] font-semibold text-void transition-colors duration-150 hover:bg-[#D4B862] disabled:opacity-50"
        >
          {continuing ? "Saving…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
