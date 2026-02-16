import { FieldErrors, UseFormRegister } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import type { EventFormValues } from "@/types/event-form";

type Props = {
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
};

export default function DateTimeSection({ register, errors }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Date & time</h2>
        <p className="text-sm text-zinc-400">
          Choose when the doors open and the event wraps.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <InputField
          label="Event Date"
          type="date"
          {...register("eventDate", {
            required: "Event date is required.",
          })}
          error={errors.eventDate?.message}
        />
        <InputField
          label="Start Time"
          type="time"
          {...register("startTime", {
            required: "Start time is required.",
          })}
          error={errors.startTime?.message}
        />
        <InputField
          label="End Time"
          type="time"
          {...register("endTime", {
            required: "End time is required.",
          })}
          error={errors.endTime?.message}
        />
      </div>
    </section>
  );
}
