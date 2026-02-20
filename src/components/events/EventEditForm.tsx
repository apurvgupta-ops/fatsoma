"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateEvent } from "@/app/actions/events";
import { uploadImage } from "@/app/actions/upload";
import EventDetailsSection from "@/components/admin/EventDetailsSection";
import LocationDetailsSection from "@/components/admin/LocationDetailsSection";
import DateTimeSection from "@/components/admin/DateTimeSection";
import TicketConfigSection from "@/components/admin/TicketConfigSection";
import PricingModelSection from "@/components/admin/PricingModelSection";
import PublishSidebar from "@/components/admin/PublishSidebar";
import Toast from "@/components/admin/Toast";
import MobilePublishFooter from "@/components/admin/MobilePublishFooter";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import type { EventFormValues, ToastState } from "@/types/event-form";

type Event = {
  id: string;
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  eventImage: string;
  eventBanner?: string;
  venueName: string;
  addressLine: string;
  city: string;
  postcode: string;
  country: string;
  mapsLink?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalTickets: number;
  ticketBatches: {
    name: string;
    quantity: number;
    basePrice: number;
    minDiscount: number;
    maxDiscount: number;
  }[];
  dynamicPricing: boolean;
  bookingFee: number;
  allowResale: boolean;
  platformCommission: number;
  status: "draft" | "published";
};

type Props = {
  event: Event;
};

export default function EventEditForm({ event }: Props) {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);

  // Format the date for the date input (YYYY-MM-DD)
  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toISOString().split("T")[0]
    : "";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    defaultValues: {
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      eventCategory: event.eventCategory,
      venueName: event.venueName,
      addressLine: event.addressLine,
      city: event.city,
      postcode: event.postcode,
      country: event.country,
      mapsLink: event.mapsLink || "",
      eventDate: formattedDate,
      startTime: event.startTime,
      endTime: event.endTime,
      totalTickets: event.totalTickets,
      ticketBatches: event.ticketBatches,
      dynamicPricing: event.dynamicPricing,
      bookingFee: event.bookingFee,
      allowResale: event.allowResale,
      platformCommission: event.platformCommission,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketBatches",
  });

  const ticketBatches = watch("ticketBatches");
  const totalTickets = watch("totalTickets");

  const totals = useMemo(() => {
    const totalsSeed = {
      tickets: 0,
      minRevenue: 0,
      maxRevenue: 0,
    };

    return (ticketBatches ?? []).reduce((acc, batch) => {
      const quantity = Number(batch.quantity) || 0;
      const basePrice = Number(batch.basePrice) || 0;
      const minDiscount = Number(batch.minDiscount) || 0;
      const maxDiscount = Number(batch.maxDiscount) || 0;

      acc.tickets += quantity;
      acc.minRevenue += quantity * basePrice * (1 - maxDiscount / 100);
      acc.maxRevenue += quantity * basePrice * (1 - minDiscount / 100);
      return acc;
    }, totalsSeed);
  }, [ticketBatches]);

  const handleToast = (next: ToastState) => {
    setToast(next);
    if (next) {
      window.setTimeout(() => setToast(null), 3000);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadImage(formData);

    if (!result.ok || !result.url) {
      throw new Error(result.error || "Failed to upload image");
    }

    return result.url;
  };

  const onSubmit = async (
    values: EventFormValues,
    status: "draft" | "published",
  ) => {
    try {
      // Handle file uploads - keep existing images if no new upload
      let eventImage = event.eventImage;
      let eventBanner = event.eventBanner;

      if (values.eventImage?.[0]) {
        try {
          eventImage = await uploadFile(values.eventImage[0]);
        } catch (error) {
          handleToast({
            type: "error",
            message: "Failed to upload event image",
          });
          return;
        }
      }

      if (values.eventBanner?.[0]) {
        try {
          eventBanner = await uploadFile(values.eventBanner[0]);
        } catch (error) {
          console.error("Failed to upload banner:", error);
          // Banner is optional, so continue without it
        }
      }

      const result = await updateEvent(
        event.id,
        {
          eventName: values.eventName,
          eventDescription: values.eventDescription,
          eventCategory: values.eventCategory,
          eventImage,
          eventBanner,
          venueName: values.venueName,
          addressLine: values.addressLine,
          city: values.city,
          postcode: values.postcode,
          country: values.country,
          mapsLink: values.mapsLink,
          eventDate: values.eventDate,
          startTime: values.startTime,
          endTime: values.endTime,
          totalTickets: values.totalTickets,
          ticketBatches: values.ticketBatches,
          dynamicPricing: values.dynamicPricing,
          bookingFee: values.bookingFee,
          allowResale: values.allowResale,
          platformCommission: values.platformCommission,
        },
        status,
      );

      if (!result.ok) {
        handleToast({ type: "error", message: result.message });
        return;
      }

      handleToast({
        type: "success",
        message: result.message,
      });

      // Redirect to event detail page after successful update
      setTimeout(() => {
        router.push(`/events/${event.id}`);
      }, 1500);
    } catch (error) {
      handleToast({ type: "error", message: "Unexpected error occurred." });
    }
  };

  const handleSaveDraft = async () => {
    const values = watch();
    await onSubmit(values, "draft");
  };

  const handlePublish = handleSubmit((values) => onSubmit(values, "published"));

  return (
    <AuthenticatedLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {/* Page Header with Back Button */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/events/${event.id}`}
              className="rounded-xl border border-white/10 bg-zinc-950/60 p-2 transition hover:border-white/20 hover:bg-zinc-950/80"
            >
              <svg
                className="h-5 w-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Edit Event
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Update event details and republish
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
              {event.eventName}
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                event.status === "published"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {event.status === "published" ? "Published" : "Draft"}
            </span>
          </div>
        </header>

        <form
          id="event-form"
          onSubmit={handlePublish}
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="space-y-8">
            <EventDetailsSection register={register} errors={errors} />
            <LocationDetailsSection register={register} errors={errors} />
            <DateTimeSection register={register} errors={errors} />
            <TicketConfigSection
              register={register}
              errors={errors}
              fields={fields}
              append={append}
              remove={remove}
              totals={totals}
              totalTickets={totalTickets || 0}
            />
            <PricingModelSection
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              totals={totals}
            />
          </div>

          <PublishSidebar
            isSubmitting={isSubmitting}
            eventName={watch("eventName")}
            eventCategory={watch("eventCategory")}
            totals={totals}
            onSaveDraft={handleSaveDraft}
          />
        </form>
      </div>

      <Toast toast={toast} />
      <MobilePublishFooter />
    </AuthenticatedLayout>
  );
}
