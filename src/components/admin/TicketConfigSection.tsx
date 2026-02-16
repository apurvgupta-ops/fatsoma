import {
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
  FieldArrayWithId,
} from "react-hook-form";
import InputField from "@/components/forms/InputField";
import TicketBatchCard from "./TicketBatchCard";
import type { EventFormValues, TicketTotals } from "@/types/event-form";

type Props = {
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
  fields: FieldArrayWithId<EventFormValues, "ticketBatches", "id">[];
  append: UseFieldArrayAppend<EventFormValues, "ticketBatches">;
  remove: UseFieldArrayRemove;
  totals: TicketTotals;
  totalTickets: number;
};

export default function TicketConfigSection({
  register,
  errors,
  fields,
  append,
  remove,
  totals,
  totalTickets,
}: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Ticket configuration
          </h2>
          <p className="text-sm text-zinc-400">
            Set up ticket volumes, batches, and revenue previews.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-2 text-xs text-zinc-300">
          Total from batches: {totals.tickets} tickets
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Total Number of Tickets"
          type="number"
          min={0}
          {...register("totalTickets", {
            required: "Total tickets is required.",
            valueAsNumber: true,
          })}
          error={errors.totalTickets?.message}
        />
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Remaining capacity
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {Math.max(totalTickets - totals.tickets, 0)}
          </p>
          <p className="text-xs text-zinc-400">
            {totals.tickets > totalTickets
              ? "Batches exceed total tickets"
              : "Available for later release"}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {fields.map((field, index) => (
          <TicketBatchCard
            key={field.id}
            index={index}
            register={register}
            errors={errors}
            onRemove={() => remove(index)}
            showRemove={fields.length > 1}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            append({
              name: "Phase 2",
              quantity: 100,
              basePrice: 22,
              minPrice: 18,
              maxPrice: 28,
            })
          }
          className="rounded-full border border-purple-500/50 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 transition hover:border-purple-400 hover:bg-purple-500/20"
        >
          + Add Another Batch
        </button>
        <div className="text-xs text-zinc-500">
          Dynamic ticket batches help you reward early buyers.
        </div>
      </div>
    </section>
  );
}
