import { FieldErrors, UseFormRegister } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import TextareaField from "@/components/forms/TextareaField";
import type { EventFormValues } from "@/types/event-form";

type Props = {
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
};

export default function EventDetailsSection({ register, errors }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Basic event details
          </h2>
          <p className="text-sm text-zinc-400">
            Tell guests what to expect and how to find it.
          </p>
        </div>
        <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
          Required
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Event Name"
          placeholder="Electric Nights Showcase"
          {...register("eventName", {
            required: "Event name is required.",
          })}
          error={errors.eventName?.message}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-100">
            Event Category
          </label>
          <select
            {...register("eventCategory", {
              required: "Category is required.",
            })}
            className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30"
          >
            <option>Party</option>
            <option>Club Night</option>
            <option>Concert</option>
            <option>Festival</option>
            <option>Pop-Up</option>
            <option>Conference</option>
          </select>
          {errors.eventCategory ? (
            <p className="text-xs text-rose-400">
              {errors.eventCategory.message}
            </p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <TextareaField
            label="Event Description"
            placeholder="Describe the vibe, line-up, and any important details."
            {...register("eventDescription", {
              required: "Event description is required.",
            })}
            error={errors.eventDescription?.message}
          />
        </div>
        <InputField
          label="Event Image Upload"
          type="file"
          accept="image/*"
          {...register("eventImage", {
            required: "Event image is required.",
          })}
          error={errors.eventImage?.message}
        />
        <InputField
          label="Event Banner Upload"
          type="file"
          accept="image/*"
          {...register("eventBanner")}
          hint="Optional wide banner for social sharing."
        />
      </div>
    </section>
  );
}
