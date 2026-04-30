"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { TicketBatch, CreateEventInput } from "@/lib/shared";
import { EVENT_CATEGORIES, BOOKING_FEE_PERCENT } from "@/lib/shared";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Ticket,
  Settings,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Section,
  InputField,
  SelectField,
  ToggleField,
} from "@/components/events/EventFormPrimitives";

type LocalTicketGroup = { title: string; batches: TicketBatch[] };

function stripBatchForApi(batch: TicketBatch) {
  return {
    name: batch.name.trim(),
    quantity: Number(batch.quantity) || 0,
    basePrice: Number(batch.basePrice) || 0,
    minDiscount: batch.minDiscount,
    maxDiscount: batch.maxDiscount,
    entryWindowCutoff: batch.entryWindowCutoff?.trim() || undefined,
  };
}

const DEFAULT_BATCH: TicketBatch = {
  name: "",
  quantity: 0,
  basePrice: 0,
  minDiscount: 0,
  maxDiscount: 0,
  entryWindowCutoff: "",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export default function CreateEventPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      window.setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  const [form, setForm] = useState({
    eventName: "",
    eventDescription: "",
    eventCategory: EVENT_CATEGORIES[0] as string,
    eventImage: "",
    eventBanner: "",
    venueName: "",
    addressLine: "",
    city: "",
    postcode: "",
    country: "",
    mapsLink: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    dynamicPricing: false,
    allowResale: false,
    platformCommission: 5,
  });

  const [ticketGroups, setTicketGroups] = useState<LocalTicketGroup[]>([
    { title: "General admission", batches: [{ ...DEFAULT_BATCH, name: "" }] },
  ]);

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateGroupTitle = (groupIndex: number, title: string) => {
    setTicketGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, title } : g)),
    );
  };

  const updateBatch = (
    groupIndex: number,
    batchIndex: number,
    field: keyof TicketBatch,
    value: string | number,
  ) => {
    setTicketGroups((prev) =>
      prev.map((g, i) =>
        i !== groupIndex
          ? g
          : {
              ...g,
              batches: g.batches.map((b, j) =>
                j !== batchIndex
                  ? b
                  : {
                      ...b,
                      [field]:
                        typeof DEFAULT_BATCH[field] === "number"
                          ? Number(value)
                          : value,
                    },
              ),
            },
      ),
    );
  };

  const addBatchToGroup = (groupIndex: number) => {
    setTicketGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, batches: [...g.batches, { ...DEFAULT_BATCH }] }
          : g,
      ),
    );
  };

  const removeBatchFromGroup = (groupIndex: number, batchIndex: number) => {
    setTicketGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIndex) return g;
        if (g.batches.length <= 1) return g;
        return { ...g, batches: g.batches.filter((_, j) => j !== batchIndex) };
      }),
    );
  };

  const addTicketGroup = () => {
    setTicketGroups((prev) => [
      ...prev,
      { title: "", batches: [{ ...DEFAULT_BATCH }] },
    ]);
  };

  const removeTicketGroup = (groupIndex: number) => {
    setTicketGroups((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== groupIndex),
    );
  };

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !token) return;

      setUploading(true);
      try {
        const client = createApiClient(token);
        const res = await client.uploadImage(file);
        if (res.ok && res.data) {
          updateField("eventImage", res.data.url);
          showToast("success", "Image uploaded successfully.");
        }
      } catch (err: unknown) {
        showToast(
          "error",
          err instanceof Error ? err.message : "Image upload failed",
        );
      } finally {
        setUploading(false);
      }
    },
    [token, showToast],
  );

  const handleSubmit = async (status: "draft" | "published") => {
    setSaving(true);

    try {
      if (!token) throw new Error("Not authenticated");

      const totalTickets = ticketGroups.reduce(
        (s, g) => s + g.batches.reduce((ss, b) => ss + Number(b.quantity || 0), 0),
        0,
      );
      const input: CreateEventInput = {
        ...form,
        eventImage: form.eventImage || `placeholder-${Date.now()}`,
        totalTickets,
        ticketGroups: ticketGroups.map((g, idx) => ({
          title: g.title.trim() || `Group ${idx + 1}`,
          sortOrder: idx,
          batches: g.batches.map(stripBatchForApi),
        })),
        status,
      };

      const client = createApiClient(token);
      const res = await client.createEvent(input);
      if (res.ok) {
        showToast(
          "success",
          status === "published"
            ? "Event published successfully."
            : "Event saved as draft.",
        );
        window.setTimeout(() => router.push("/events"), 500);
      } else {
        showToast("error", res.message || "Failed to create event");
      }
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to create event",
      );
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = form.eventImage
    ? form.eventImage.startsWith("/uploads/")
      ? `${API_URL}${form.eventImage}`
      : form.eventImage
    : null;

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link
            href="/events"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/40 text-cream/60 transition hover:bg-surface/60 hover:text-cream"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="mb-1 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
              <span className="h-px w-10 bg-linear-to-r from-gold to-gold-light" />
              New Event
            </div>
            <h1 className="text-3xl font-semibold text-cream">Create Event</h1>
          </div>
        </header>

        {/* Event Details */}
        <Section title="Event Details" icon={<Calendar className="h-5 w-5" />}>
          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              label="Event Name"
              value={form.eventName}
              onChange={(v) => updateField("eventName", v)}
              placeholder="e.g. Summer Techno Festival"
              required
              className="md:col-span-2"
            />
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-cream/90">
                Description
              </label>
              <textarea
                rows={4}
                value={form.eventDescription}
                onChange={(e) =>
                  updateField("eventDescription", e.target.value)
                }
                placeholder="Describe your event..."
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm text-cream placeholder-zinc-500 outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
              />
            </div>
            <SelectField
              label="Category"
              value={form.eventCategory}
              onChange={(v) => updateField("eventCategory", v)}
              options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <InputField
              label="Event Date"
              type="date"
              value={form.eventDate}
              onChange={(v) => updateField("eventDate", v)}
              required
            />
            <InputField
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(v) => updateField("startTime", v)}
              required
            />
            <InputField
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(v) => updateField("endTime", v)}
              required
            />
          </div>
        </Section>

        {/* Image Upload */}
        <Section title="Event Image" icon={<ImageIcon className="h-5 w-5" />}>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {imageUrl ? (
              <div className="relative h-40 w-60 overflow-hidden rounded-2xl border border-border">
                <Image
                  src={imageUrl}
                  alt="Event"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => updateField("eventImage", "")}
                  className="absolute right-2 top-2 rounded-lg bg-surface/80 p-1.5 text-cream/60 backdrop-blur-sm transition hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface/40 text-cream/60 transition hover:border-gold/40 hover:text-gold">
                {uploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                ) : (
                  <>
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Upload Image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
            <p className="text-xs text-cream/60">
              PNG, JPG, WEBP up to 5MB. Leave empty for a placeholder.
            </p>
          </div>
        </Section>

        {/* Venue */}
        <Section title="Venue Details" icon={<MapPin className="h-5 w-5" />}>
          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              label="Venue Name"
              value={form.venueName}
              onChange={(v) => updateField("venueName", v)}
              placeholder="e.g. The Warehouse"
              required
            />
            <InputField
              label="Address Line"
              value={form.addressLine}
              onChange={(v) => updateField("addressLine", v)}
              placeholder="e.g. 123 High Street"
              required
            />
            <InputField
              label="City"
              value={form.city}
              onChange={(v) => updateField("city", v)}
              placeholder="e.g. London"
              required
            />
            <InputField
              label="Postcode"
              value={form.postcode}
              onChange={(v) => updateField("postcode", v)}
              placeholder="e.g. EC1A 1BB"
              required
            />
            <InputField
              label="Country"
              value={form.country}
              onChange={(v) => updateField("country", v)}
              placeholder="e.g. United Kingdom"
              required
            />
            <InputField
              label="Google Maps Link"
              value={form.mapsLink ?? ""}
              onChange={(v) => updateField("mapsLink", v)}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </Section>

        {/* Ticket groups & slots */}
        <Section title="Ticket tiers" icon={<Ticket className="h-5 w-5" />}>
          <p className="mb-4 text-xs text-cream/55">
            Add a heading per tier family (e.g. General admission), then one row
            per time slot or price band. Slot names must be unique across the
            whole event.
          </p>
          <div className="flex flex-col gap-6">
            {ticketGroups.map((group, gi) => (
              <div
                key={gi}
                className="rounded-2xl border border-border bg-surface/40 p-5"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <InputField
                      label="Group heading"
                      value={group.title}
                      onChange={(v) => updateGroupTitle(gi, v)}
                      placeholder="e.g. General admission"
                      required
                      className="sm:max-w-md"
                    />
                  </div>
                  {ticketGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketGroup(gi)}
                      className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-cream/60 transition hover:border-rose-500/40 hover:text-rose-400"
                    >
                      Remove group
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {group.batches.map((batch, bi) => (
                    <div
                      key={`${gi}-${bi}`}
                      className="rounded-xl border border-border/80 bg-void/40 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-cream/50">
                          Slot {bi + 1}
                        </span>
                        {group.batches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBatchFromGroup(gi, bi)}
                            className="rounded-lg p-1.5 text-cream/60 transition hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <InputField
                          label="Slot name"
                          value={batch.name}
                          onChange={(v) => updateBatch(gi, bi, "name", v)}
                          placeholder="e.g. 11pm entry"
                          required
                        />
                        <InputField
                          label="Quantity"
                          type="number"
                          value={String(batch.quantity)}
                          onChange={(v) => updateBatch(gi, bi, "quantity", v)}
                          required
                        />
                        <InputField
                          label="Price (£)"
                          type="number"
                          value={String(batch.basePrice)}
                          onChange={(v) => updateBatch(gi, bi, "basePrice", v)}
                          required
                        />
                        <div className="sm:col-span-2 lg:col-span-3">
                          <InputField
                            label="Entry Window Cutoff"
                            type="datetime-local"
                            value={batch.entryWindowCutoff ?? ""}
                            onChange={(v) =>
                              updateBatch(gi, bi, "entryWindowCutoff", v)
                            }
                            placeholder="Optional"
                          />
                          <p className="mt-1 text-xs text-cream/55">
                            Optional: after this datetime, entry with this tier is
                            no longer valid.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addBatchToGroup(gi)}
                    className="flex items-center gap-2 self-start rounded-xl border border-dashed border-border bg-surface/40 px-4 py-2.5 text-sm font-medium text-cream/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    <Plus className="h-4 w-4" /> Add slot in this group
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTicketGroup}
              className="flex items-center gap-2 self-start rounded-xl border border-dashed border-gold/30 bg-gold/5 px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/10"
            >
              <Plus className="h-4 w-4" /> Add ticket group
            </button>
          </div>
        </Section>

        {/* Platform Settings */}
        <Section
          title="Platform Settings"
          icon={<Settings className="h-5 w-5" />}
        >
          <div className="grid gap-5 md:grid-cols-2">
            {/* <InputField
              label="Platform Commission (%)"
              type="number"
              value={String(form.platformCommission)}
              onChange={(v) => updateField("platformCommission", Number(v))}
              required
            /> */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/40 px-4 py-3">
              <span className="text-sm text-cream/60">Booking Fee</span>
              <span className="ml-auto font-mono text-sm font-semibold text-gold">
                {BOOKING_FEE_PERCENT}%
              </span>
              <span className="text-xs text-cream/60">(platform-wide)</span>
            </div>
            {/* <ToggleField
              label="Dynamic Pricing"
              checked={form.dynamicPricing}
              onChange={(v) => updateField("dynamicPricing", v)}
              description="Automatically adjust prices based on demand"
            /> */}
            <ToggleField
              label="Allow Resale"
              checked={form.allowResale}
              onChange={(v) => updateField("allowResale", v)}
              description="Let ticket holders resell their tickets"
            />
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="rounded-xl border border-border bg-surface/40 px-6 py-3 text-sm font-semibold text-cream/90 transition hover:bg-surface/60 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={saving}
            className="rounded-xl bg-linear-to-r from-gold via-gold/80 to-gold-light px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-gold/30 transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Publishing..." : "Publish Event"}
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex max-w-md items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
