import { FieldErrors, UseFormRegister } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import type { EventFormValues, TicketBatch } from "@/types/event-form";

type Props = {
  index: number;
  register: UseFormRegister<EventFormValues>;
  errors: FieldErrors<EventFormValues>;
  onRemove: () => void;
  showRemove: boolean;
};

export default function TicketBatchCard({
  index,
  register,
  errors,
  onRemove,
  showRemove,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Batch {index + 1}</h3>
        {showRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-rose-300 transition hover:text-rose-200"
          >
            Remove batch
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <InputField
          label="Batch Name"
          placeholder="Phase 1"
          {...register(`ticketBatches.${index}.name`, {
            required: "Batch name is required.",
          })}
          error={errors.ticketBatches?.[index]?.name?.message}
        />
        <InputField
          label="Tickets"
          type="number"
          min={0}
          {...register(`ticketBatches.${index}.quantity`, {
            required: "Quantity is required.",
            valueAsNumber: true,
          })}
          error={errors.ticketBatches?.[index]?.quantity?.message}
        />
        <InputField
          label="Base Price (£)"
          type="number"
          min={0}
          step="0.01"
          {...register(`ticketBatches.${index}.basePrice`, {
            required: "Base price is required.",
            valueAsNumber: true,
          })}
          error={errors.ticketBatches?.[index]?.basePrice?.message}
        />
        <InputField
          label="Min Price (£)"
          type="number"
          min={0}
          step="0.01"
          {...register(`ticketBatches.${index}.minPrice`, {
            required: "Minimum price is required.",
            valueAsNumber: true,
          })}
          error={errors.ticketBatches?.[index]?.minPrice?.message}
        />
        <InputField
          label="Max Price (£)"
          type="number"
          min={0}
          step="0.01"
          {...register(`ticketBatches.${index}.maxPrice`, {
            required: "Maximum price is required.",
            valueAsNumber: true,
          })}
          error={errors.ticketBatches?.[index]?.maxPrice?.message}
        />
      </div>
    </div>
  );
}
