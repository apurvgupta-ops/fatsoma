"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { createEvent } from "@/app/actions/events";
import { uploadImage } from "@/app/actions/upload";
import PageHeader from "@/components/admin/PageHeader";
import EventDetailsSection from "@/components/admin/EventDetailsSection";
import LocationDetailsSection from "@/components/admin/LocationDetailsSection";
import DateTimeSection from "@/components/admin/DateTimeSection";
import TicketConfigSection from "@/components/admin/TicketConfigSection";
import PricingModelSection from "@/components/admin/PricingModelSection";
import PublishSidebar from "@/components/admin/PublishSidebar";
import Toast from "@/components/admin/Toast";
import MobilePublishFooter from "@/components/admin/MobilePublishFooter";
import type {
  EventFormValues,
  TicketBatch,
  ToastState,
} from "@/types/event-form";

const defaultBatch: TicketBatch = {
  name: "Early Bird",
  quantity: 150,
  basePrice: 18,
  minDiscount: 0,
  maxDiscount: 15,
};

export default function Home() {
  const [toast, setToast] = useState<ToastState>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    defaultValues: {
      eventCategory: "Party",
      totalTickets: 500,
      ticketBatches: [defaultBatch],
      dynamicPricing: true,
      bookingFee: 5,
      allowResale: false,
      platformCommission: 8,
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
      // Handle file uploads
      let eventImage = "placeholder-event-image.jpg";
      let eventBanner: string | undefined = undefined;

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

      const result = await createEvent(
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
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[140px]" />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <PageHeader />

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
      </div>

      <Toast toast={toast} />
      <MobilePublishFooter />
    </div>
  );
}
