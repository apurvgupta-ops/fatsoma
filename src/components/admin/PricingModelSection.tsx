import {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import InputField from "@/components/forms/InputField";
import ToggleField from "@/components/forms/ToggleField";
import RevenuePreview from "./RevenuePreview";
import type { EventFormValues, TicketTotals } from "@/types/event-form";

type Props = {
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
  watch: UseFormWatch<EventFormValues>;
  setValue: UseFormSetValue<EventFormValues>;
  totals: TicketTotals;
};

export default function PricingModelSection({
  register,
  errors,
  watch,
  setValue,
  totals,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Pricing model settings
        </h2>
        <p className="text-sm text-zinc-400">
          Control dynamic pricing, fees, and resale permissions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ToggleField
          id="dynamicPricing"
          label="Enable Dynamic Pricing"
          description="Adjusts pricing based on demand."
          checked={watch("dynamicPricing")}
          onChange={(value) =>
            setValue("dynamicPricing", value, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
        />
        <ToggleField
          id="allowResale"
          label="Allow Ticket Resale"
          description="Enable verified resale marketplace."
          checked={watch("allowResale")}
          onChange={(value) =>
            setValue("allowResale", value, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
        />
        <InputField
          label="Booking Fee Percentage"
          type="number"
          min={0}
          max={10}
          step="0.1"
          {...register("bookingFee", {
            required: "Booking fee is required.",
            valueAsNumber: true,
            min: { value: 0, message: "Minimum is 0%." },
            max: { value: 10, message: "Maximum is 10%." },
          })}
          error={errors.bookingFee?.message}
        />
        <InputField
          label="Platform Commission Percentage"
          type="number"
          min={0}
          max={25}
          step="0.1"
          {...register("platformCommission", {
            required: "Commission is required.",
            valueAsNumber: true,
          })}
          error={errors.platformCommission?.message}
        />
      </div>

      <RevenuePreview
        totals={totals}
        bookingFee={watch("bookingFee") || 0}
        platformCommission={watch("platformCommission") || 0}
      />
    </section>
  );
}
