import { Ticket, Plus, Trash2 } from "lucide-react";
import type { TicketBatch } from "@/lib/shared";
import { Section, InputField } from "@/components/events/EventFormPrimitives";

export type LocalTicketGroup = { title: string; batches: TicketBatch[] };

type Props = {
  ticketGroups: LocalTicketGroup[];
  onUpdateGroupTitle: (groupIndex: number, title: string) => void;
  onUpdateBatch: (
    groupIndex: number,
    batchIndex: number,
    field: keyof TicketBatch,
    value: string | number,
  ) => void;
  onAddBatchToGroup: (groupIndex: number) => void;
  onRemoveBatchFromGroup: (groupIndex: number, batchIndex: number) => void;
  onAddTicketGroup: () => void;
  onRemoveTicketGroup: (groupIndex: number) => void;
};

export function TicketTiersEditor({
  ticketGroups,
  onUpdateGroupTitle,
  onUpdateBatch,
  onAddBatchToGroup,
  onRemoveBatchFromGroup,
  onAddTicketGroup,
  onRemoveTicketGroup,
}: Props) {
  return (
    <Section title="Ticket tiers" icon={<Ticket className="h-5 w-5" />}>
      <p className="mb-4 text-xs text-cream/55">
        Group heading (e.g. General admission) and unique slot names per row.
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
                  onChange={(v) => onUpdateGroupTitle(gi, v)}
                  placeholder="e.g. General admission"
                  required
                  className="sm:max-w-md"
                />
              </div>
              {ticketGroups.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveTicketGroup(gi)}
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
                        onClick={() => onRemoveBatchFromGroup(gi, bi)}
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
                      onChange={(v) => onUpdateBatch(gi, bi, "name", v)}
                      placeholder="e.g. 11pm entry"
                      required
                    />
                    <InputField
                      label="Quantity"
                      type="number"
                      value={String(batch.quantity)}
                      onChange={(v) => onUpdateBatch(gi, bi, "quantity", v)}
                      required
                    />
                    <InputField
                      label="Price (£)"
                      type="number"
                      value={String(batch.basePrice)}
                      onChange={(v) => onUpdateBatch(gi, bi, "basePrice", v)}
                      required
                    />
                    <div className="sm:col-span-2 lg:col-span-3">
                      <InputField
                        label="Entry Window Cutoff"
                        type="datetime-local"
                        value={batch.entryWindowCutoff ?? ""}
                        onChange={(v) =>
                          onUpdateBatch(gi, bi, "entryWindowCutoff", v)
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
                onClick={() => onAddBatchToGroup(gi)}
                className="flex items-center gap-2 self-start rounded-xl border border-dashed border-border bg-surface/40 px-4 py-2.5 text-sm font-medium text-cream/60 transition hover:border-gold/40 hover:text-gold"
              >
                <Plus className="h-4 w-4" /> Add slot in this group
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddTicketGroup}
          className="flex items-center gap-2 self-start rounded-xl border border-dashed border-gold/30 bg-gold/5 px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/10"
        >
          <Plus className="h-4 w-4" /> Add ticket group
        </button>
      </div>
    </Section>
  );
}
