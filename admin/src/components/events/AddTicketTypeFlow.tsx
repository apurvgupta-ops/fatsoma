"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { TicketBatch } from "@/lib/shared";
import { InputField } from "@/components/events/EventFormPrimitives";
import {
  TICKET_TYPE_PRESETS,
  type TicketTypePreset,
  type TicketTypePresetId,
} from "@/components/events/ticketPresetOptions";
import type { LocalTicketGroup } from "@/components/events/TicketTiersEditor";

const DEFAULT_BATCH: TicketBatch = {
  name: "",
  quantity: 0,
  basePrice: 0,
  minDiscount: 0,
  maxDiscount: 0,
  entryWindowCutoff: "",
};

function emptyBatch(): TicketBatch {
  return { ...DEFAULT_BATCH };
}

function initialBatchesForPreset(preset: TicketTypePreset): TicketBatch[] {
  if (preset.mode === "dual") {
    return [
      { ...emptyBatch(), name: "Male" },
      { ...emptyBatch(), name: "Female" },
    ];
  }
  return [{ ...emptyBatch(), name: preset.defaultSlotName ?? "" }];
}

function normalizeBatchForSubmit(batch: TicketBatch): TicketBatch {
  return {
    ...batch,
    name: batch.name.trim(),
    quantity: Math.max(0, Number(batch.quantity) || 0),
    basePrice: Math.max(0, Number(batch.basePrice) || 0),
    entryWindowCutoff: batch.entryWindowCutoff?.trim() || "",
  };
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.length >= 16 ? value.slice(0, 16) : value;
  }
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

type Props = {
  onAdd: (group: LocalTicketGroup) => void;
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
  onRemoveTicketGroup: (groupIndex: number) => void;
};

export function AddTicketTypeFlow({
  onAdd,
  ticketGroups,
  onUpdateGroupTitle,
  onUpdateBatch,
  onAddBatchToGroup,
  onRemoveBatchFromGroup,
  onRemoveTicketGroup,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<TicketTypePresetId | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<TicketTypePreset | null>(
    null,
  );

  const [groupTitle, setGroupTitle] = useState("");
  const [modalBatches, setModalBatches] = useState<TicketBatch[]>([
    emptyBatch(),
  ]);
  const [openGroupIndices, setOpenGroupIndices] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalSubmitError, setModalSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroupIndices((prev) =>
      prev.filter((idx) => idx < ticketGroups.length),
    );
  }, [ticketGroups.length]);

  const toggleOpenGroup = (groupIndex: number) => {
    setOpenGroupIndices((prev) =>
      prev.includes(groupIndex)
        ? prev.filter((idx) => idx !== groupIndex)
        : [...prev, groupIndex],
    );
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const patchBatch = (
    index: number,
    field: keyof TicketBatch,
    value: string | number,
  ) => {
    setModalSubmitError(null);
    setModalBatches((prev) =>
      prev.map((b, i) =>
        i !== index
          ? b
          : {
              ...b,
              [field]:
                typeof DEFAULT_BATCH[field] === "number"
                  ? Math.max(0, Number(value) || 0)
                  : value,
            },
      ),
    );
  };

  const addSlot = () => {
    setModalSubmitError(null);
    setModalBatches((prev) => [...prev, { ...emptyBatch() }]);
  };

  const removeSlot = (index: number) => {
    setModalSubmitError(null);
    setModalBatches((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const handleBack = () => {
    setExpanded(false);
    setSelectedId(null);
  };

  const handleContinue = () => {
    if (!selectedId) return;
    const preset = TICKET_TYPE_PRESETS.find((p) => p.id === selectedId);
    if (!preset) return;
    setActivePreset(preset);
    setGroupTitle(preset.groupTitleSuggestion);
    setModalBatches(initialBatchesForPreset(preset));
    setModalOpen(true);
    setExpanded(false);
    setModalSubmitError(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActivePreset(null);
    setModalSubmitError(null);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePreset) return;

    const title = groupTitle.trim();
    if (!title) {
      setModalSubmitError("Enter a group heading.");
      return;
    }

    for (let i = 0; i < modalBatches.length; i++) {
      const batch = modalBatches[i];
      const slot = i + 1;
      if (!batch.name.trim()) {
        setModalSubmitError(`Enter a slot name for slot ${slot}.`);
        return;
      }
      if ((Number(batch.quantity) || 0) < 1) {
        setModalSubmitError(
          `Quantity for "${batch.name.trim()}" must be at least 1.`,
        );
        return;
      }
      if ((Number(batch.basePrice) || 0) < 0) {
        setModalSubmitError(
          `Price for "${batch.name.trim()}" cannot be negative.`,
        );
        return;
      }
    }

    onAdd({
      title,
      batches: modalBatches.map(normalizeBatchForSubmit),
    });
    setToastMessage(`${title} ticket group added.`);
    window.setTimeout(() => setToastMessage(null), 2500);

    closeModal();
    setSelectedId(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-void/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 border-border px-5 py-4 text-left transition hover:bg-surface/30"
        >
          <span className="text-sm font-semibold text-cream">
            + Add ticket type
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-cream/60" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-cream/60" />
          )}
        </button>

        {expanded && (
          <div className="flex flex-col">
            <ul className="divide-y divide-border/80">
              {TICKET_TYPE_PRESETS.map((preset) => {
                const selected = selectedId === preset.id;
                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(preset.id)}
                      className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${
                        selected ? "bg-gold/10" : "hover:bg-surface/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-cream">
                          {preset.title}
                        </div>
                        <p className="mt-0.5 text-sm text-cream/55">
                          {preset.description}
                        </p>
                      </div>
                      {preset.addsTypesBadge && (
                        <span className="shrink-0 rounded-lg border border-border bg-surface/50 px-2.5 py-1 text-xs font-medium text-cream/70">
                          {preset.addsTypesBadge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-cream/90 transition hover:bg-surface/50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedId}
                className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-cream/90 transition hover:bg-surface/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      {ticketGroups.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-void/60 p-4">
          <p className="mb-3 text-sm font-medium text-cream/90">
            Added ticket groups
          </p>
          <div className="flex flex-col gap-3">
            {ticketGroups.map((group, groupIndex) => {
              const isOpen = openGroupIndices.includes(groupIndex);
              return (
                <div
                  key={`${group.title}-${groupIndex}`}
                  className="overflow-hidden rounded-xl border border-border/70 bg-surface/30"
                >
                  <button
                    type="button"
                    onClick={() => toggleOpenGroup(groupIndex)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface/40"
                  >
                    <span className="text-sm font-semibold text-cream">
                      {(group.title || `Group ${groupIndex + 1}`).trim()} (
                      {group.batches.length} slots)
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-cream/60" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-cream/60" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-border/70 px-4 py-4">
                      <InputField
                        label="Group heading"
                        value={group.title}
                        onChange={(v) => onUpdateGroupTitle(groupIndex, v)}
                        placeholder="e.g. General admission"
                        required
                        className="sm:max-w-md"
                      />

                      {group.batches.map((batch, batchIndex) => (
                        <div
                          key={`${groupIndex}-${batchIndex}`}
                          className="rounded-lg border border-border/70 bg-void/40 p-3"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-cream/55">
                              Slot {batchIndex + 1}
                            </span>
                            {group.batches.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveBatchFromGroup(groupIndex, batchIndex)
                                }
                                className="rounded-md p-1 text-cream/60 transition hover:bg-rose-500/10 hover:text-rose-400"
                                aria-label={`Remove slot ${batchIndex + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <InputField
                              label="Slot name"
                              value={batch.name}
                              onChange={(v) =>
                                onUpdateBatch(groupIndex, batchIndex, "name", v)
                              }
                              placeholder="e.g. 11pm entry"
                              required
                            />
                            <InputField
                              label="Quantity"
                              type="number"
                              value={String(batch.quantity)}
                              onChange={(v) =>
                                onUpdateBatch(
                                  groupIndex,
                                  batchIndex,
                                  "quantity",
                                  Math.max(0, Number(v) || 0),
                                )
                              }
                              required
                            />
                            <InputField
                              label="Price (£)"
                              type="number"
                              value={String(batch.basePrice)}
                              onChange={(v) =>
                                onUpdateBatch(
                                  groupIndex,
                                  batchIndex,
                                  "basePrice",
                                  Math.max(0, Number(v) || 0),
                                )
                              }
                              required
                            />
                          </div>
                          <div className="mt-3">
                            <InputField
                              label="Entry Window Cutoff"
                              type="datetime-local"
                              value={toDateTimeLocal(batch.entryWindowCutoff)}
                              onChange={(v) =>
                                onUpdateBatch(
                                  groupIndex,
                                  batchIndex,
                                  "entryWindowCutoff",
                                  v,
                                )
                              }
                              placeholder="Optional"
                            />
                            <p className="mt-1 text-xs text-cream/55">
                              Optional: after this datetime, entry with this
                              tier is no longer valid.
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onAddBatchToGroup(groupIndex)}
                          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-cream/70 transition hover:border-gold/40 hover:text-gold"
                        >
                          <Plus className="h-4 w-4" /> Add slot
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveTicketGroup(groupIndex)}
                          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-cream/70 transition hover:border-rose-500/40 hover:text-rose-400"
                        >
                          Remove group
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalOpen && activePreset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8"
          onClick={closeModal}
        >
          <form
            onSubmit={handleModalSubmit}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[min(90vh,880px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-void p-6 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-8"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-cream">Ticket tiers</h2>
              <p className="mt-1 text-sm text-cream/55">
                {activePreset.title} — set the group heading and one or more
                slots. Add extra slots with the button below.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <InputField
                label="Group heading"
                value={groupTitle}
                onChange={(v) => {
                  setModalSubmitError(null);
                  setGroupTitle(v);
                }}
                placeholder="e.g. General admission"
                required
                className="sm:max-w-md"
              />

              <p className="text-xs text-cream/55">
                Group heading (e.g. General admission) and unique slot names per
                row.
              </p>

              <div className="flex flex-col gap-4">
                {modalBatches.map((batch, bi) => (
                  <div
                    key={bi}
                    className="rounded-xl border border-border/80 bg-surface/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-cream/50">
                        Slot {bi + 1}
                      </span>
                      {modalBatches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(bi)}
                          className="rounded-lg p-1.5 text-cream/60 transition hover:bg-rose-500/10 hover:text-rose-400"
                          aria-label={`Remove slot ${bi + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <InputField
                        label="Slot name"
                        value={batch.name}
                        onChange={(v) => patchBatch(bi, "name", v)}
                        placeholder="e.g. 11pm entry"
                        required
                      />
                      <InputField
                        label="Quantity"
                        type="number"
                        value={String(batch.quantity)}
                        onChange={(v) =>
                          patchBatch(
                            bi,
                            "quantity",
                            Math.max(0, Number(v) || 0),
                          )
                        }
                        required
                      />
                      <InputField
                        label="Price (£)"
                        type="number"
                        value={String(batch.basePrice)}
                        onChange={(v) =>
                          patchBatch(
                            bi,
                            "basePrice",
                            Math.max(0, Number(v) || 0),
                          )
                        }
                        required
                      />
                      <div className="sm:col-span-2 lg:col-span-3">
                        <InputField
                          label="Entry Window Cutoff"
                          type="datetime-local"
                          value={toDateTimeLocal(batch.entryWindowCutoff)}
                          onChange={(v) =>
                            patchBatch(bi, "entryWindowCutoff", v)
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
                  onClick={addSlot}
                  className="flex items-center gap-2 self-start rounded-xl border border-dashed border-border bg-surface/40 px-4 py-2.5 text-sm font-medium text-cream/60 transition hover:border-gold/40 hover:text-gold"
                >
                  <Plus className="h-4 w-4" /> Add slot in this group
                </button>
              </div>
            </div>

            {modalSubmitError && (
              <div
                className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                role="alert"
              >
                {modalSubmitError}
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-cream/80 transition hover:bg-surface/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg border border-gold/50 bg-gold/15 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/25"
              >
                Add to event
              </button>
            </div>
          </form>
        </div>
      )}

      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-lg backdrop-blur-sm">
          {toastMessage}
        </div>
      )}
    </>
  );
}
