"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { TicketBatch, CreateEventInput } from "@fatsoma/shared";
import { EVENT_CATEGORIES, BOOKING_FEE_PERCENT } from "@fatsoma/shared";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Section,
  InputField,
  SelectField,
  ToggleField,
} from "@/components/events/EventFormPrimitives";

const DEFAULT_BATCH: TicketBatch = {
  name: "",
  quantity: 0,
  basePrice: 0,
  minDiscount: 0,
  maxDiscount: 0,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://onthelistapp.24livehost.com:3016";

export default function CreateEventPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
    country: "United Kingdom",
    mapsLink: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    dynamicPricing: false,
    allowResale: false,
    platformCommission: 5,
  });

  const [ticketBatches, setTicketBatches] = useState<TicketBatch[]>([
    { ...DEFAULT_BATCH, name: "General Admission" },
  ]);

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateBatch = (
    index: number,
    field: keyof TicketBatch,
    value: string | number,
  ) => {
    setTicketBatches((prev) =>
      prev.map((b, i) =>
        i === index
          ? {
            ...b,
            [field]:
              typeof DEFAULT_BATCH[field] === "number"
                ? Number(value)
                : value,
          }
          : b,
      ),
    );
  };

  const addBatch = () =>
    setTicketBatches((prev) => [...prev, { ...DEFAULT_BATCH }]);
  const removeBatch = (index: number) =>
    setTicketBatches((prev) => prev.filter((_, i) => i !== index));

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
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Image upload failed");
      } finally {
        setUploading(false);
      }
    },
    [token],
  );

  const handleSubmit = async (status: "draft" | "published") => {
    setError(null);
    setSaving(true);

    try {
      if (!token) throw new Error("Not authenticated");

      const totalTickets = ticketBatches.reduce((s, b) => s + b.quantity, 0);
      const input: CreateEventInput = {
        ...form,
        eventImage: form.eventImage || `placeholder-${Date.now()}`,
        totalTickets,
        ticketBatches,
        status,
      };

      const client = createApiClient(token);
      const res = await client.createEvent(input);
      if (res.ok) {
        router.push("/events");
      } else {
        setError(res.message || "Failed to create event");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="mb-1 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">
              <span className="h-px w-10 bg-linear-to-r from-purple-500 to-blue-400" />
              New Event
            </div>
            <h1 className="text-3xl font-semibold text-white">Create Event</h1>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

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
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                rows={4}
                value={form.eventDescription}
                onChange={(e) =>
                  updateField("eventDescription", e.target.value)
                }
                placeholder="Describe your event..."
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
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
              <div className="relative h-40 w-60 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={imageUrl}
                  alt="Event"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => updateField("eventImage", "")}
                  className="absolute right-2 top-2 rounded-lg bg-zinc-900/80 p-1.5 text-zinc-400 backdrop-blur-sm transition hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-40 w-60 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-zinc-900/40 text-zinc-400 transition hover:border-purple-500/40 hover:text-purple-300">
                {uploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
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
            <p className="text-xs text-zinc-500">
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

        {/* Ticket Batches */}
        <Section title="Ticket Batches" icon={<Ticket className="h-5 w-5" />}>
          <div className="flex flex-col gap-4">
            {ticketBatches.map((batch, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">
                    Batch {i + 1}
                  </span>
                  {ticketBatches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBatch(i)}
                      className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <InputField
                    label="Name"
                    value={batch.name}
                    onChange={(v) => updateBatch(i, "name", v)}
                    placeholder="e.g. Early Bird"
                    required
                  />
                  <InputField
                    label="Quantity"
                    type="number"
                    value={String(batch.quantity)}
                    onChange={(v) => updateBatch(i, "quantity", v)}
                    required
                  />
                  <InputField
                    label="Price (£)"
                    type="number"
                    value={String(batch.basePrice)}
                    onChange={(v) => updateBatch(i, "basePrice", v)}
                    required
                  />
                  {/* <InputField
                    label="Min Discount %"
                    type="number"
                    value={String(batch.minDiscount)}
                    onChange={(v) => updateBatch(i, "minDiscount", v)}
                  />
                  <InputField
                    label="Max Discount %"
                    type="number"
                    value={String(batch.maxDiscount)}
                    onChange={(v) => updateBatch(i, "maxDiscount", v)}
                  /> */}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addBatch}
              className="flex items-center gap-2 self-start rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-purple-500/40 hover:text-purple-300"
            >
              <Plus className="h-4 w-4" /> Add Ticket Batch
            </button>
          </div>
        </Section>

        {/* Platform Settings */}
        <Section
          title="Platform Settings"
          icon={<Settings className="h-5 w-5" />}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              label="Platform Commission (%)"
              type="number"
              value={String(form.platformCommission)}
              onChange={(v) => updateField("platformCommission", Number(v))}
              required
            />
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-sm text-zinc-400">Booking Fee</span>
              <span className="ml-auto font-mono text-sm font-semibold text-purple-300">{BOOKING_FEE_PERCENT}%</span>
              <span className="text-xs text-zinc-600">(platform-wide)</span>
            </div>
            <ToggleField
              label="Dynamic Pricing"
              checked={form.dynamicPricing}
              onChange={(v) => updateField("dynamicPricing", v)}
              description="Automatically adjust prices based on demand"
            />
            <ToggleField
              label="Allow Resale"
              checked={form.allowResale}
              onChange={(v) => updateField("allowResale", v)}
              description="Let ticket holders resell their tickets"
            />
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={saving}
            className="rounded-xl bg-linear-to-r from-indigo-500 via-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Publishing..." : "Publish Event"}
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
