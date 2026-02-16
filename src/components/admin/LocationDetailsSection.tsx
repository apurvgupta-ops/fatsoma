import { FieldErrors, UseFormRegister } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import type { EventFormValues } from "@/types/event-form";

type Props = {
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
};

export default function LocationDetailsSection({ register, errors }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Location details</h2>
        <p className="text-sm text-zinc-400">
          Add the venue and arrival information for guests.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Venue Name"
          placeholder="The Skyline Hall"
          {...register("venueName", {
            required: "Venue name is required.",
          })}
          error={errors.venueName?.message}
        />
        <InputField
          label="Address Line"
          placeholder="123 Regent Street"
          {...register("addressLine", {
            required: "Address line is required.",
          })}
          error={errors.addressLine?.message}
        />
        <InputField
          label="City"
          placeholder="London"
          {...register("city", {
            required: "City is required.",
          })}
          error={errors.city?.message}
        />
        <InputField
          label="Postcode"
          placeholder="W1A 1HQ"
          {...register("postcode", {
            required: "Postcode is required.",
          })}
          error={errors.postcode?.message}
        />
        <InputField
          label="Country"
          placeholder="United Kingdom"
          {...register("country", {
            required: "Country is required.",
          })}
          error={errors.country?.message}
        />
        <InputField
          label="Google Maps Link"
          placeholder="https://maps.google.com"
          {...register("mapsLink")}
          hint="Optional, helps guests navigate quickly."
        />
      </div>
    </section>
  );
}
