"use client";

import { useEffect, useRef, useState } from "react";
import type { DraftGroup, DraftTier } from "./ticketTemplates";

type SoldMap = Record<string, number>;

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full border border-[#888888] font-serif text-[9px] text-[#888888] italic select-none"
      >
        i
      </span>
      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-[100] w-[200px] rounded-lg border border-[#222222] bg-[#1A1A1A] p-3 font-sans text-[11px] leading-normal text-[#888888] shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
          {text}
        </div>
      )}
    </span>
  );
}

function TierMenuItem({
  label,
  onClick,
  disabled,
  danger,
  title,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
}) {
  const [hover, setHover] = useState(false);
  const baseColor = danger ? "#F87171" : "#888888";

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block w-full border-none bg-transparent px-3.5 py-2 text-left font-sans text-xs transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        color: disabled ? "#555555" : hover ? (danger ? "#F87171" : "#C9A84C") : baseColor,
      }}
    >
      {label}
    </button>
  );
}

function TierMenu({
  tier,
  index,
  tierCount,
  locked,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  tier: DraftTier;
  index: number;
  tierCount: number;
  locked: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const deleteDisabled = locked || tierCount <= 1;
  const deleteTitle = locked
    ? "Can't delete a tier with sales"
    : tierCount <= 1
      ? "A group must have at least one tier"
      : undefined;

  const items: {
    key: string;
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    title?: string;
  }[] = [
    { key: "duplicate", label: "Duplicate", onClick: onDuplicate },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      disabled: deleteDisabled,
      title: deleteTitle,
      onClick: onDelete,
    },
  ];
  if (index > 0) items.push({ key: "up", label: "Move Up", onClick: onMoveUp });
  if (index < tierCount - 1)
    items.push({ key: "down", label: "Move Down", onClick: onMoveDown });

  return (
    <div className="absolute top-[calc(100%+6px)] right-0 z-[100] min-w-[160px] rounded-lg border border-[#222222] bg-[#1A1A1A] py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
      {items.map(({ key, ...item }) => (
        <TierMenuItem key={key} {...item} />
      ))}
    </div>
  );
}

function PromoCodesSection() {
  const [codes, setCodes] = useState<
    { id: string; name: string; type: string; value: string }[]
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");

  const resetForm = () => {
    setName("");
    setType("percentage");
    setValue("");
    setShowForm(false);
  };

  const addCode = () => {
    if (!name.trim() || !value) return;
    setCodes((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), name: name.trim().toUpperCase(), type, value },
    ]);
    resetForm();
  };

  return (
    <div className="rounded-[10px] p-[20px_18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="mb-2 font-sans text-sm font-semibold text-cream">Promo Codes</div>
      <div className="mb-3.5 font-sans text-xs leading-relaxed text-[#888888]">
        Codes apply across all tiers and groups for this event.
      </div>

      {codes.length > 0 && (
        <div className="mb-3.5 flex flex-col gap-2">
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 rounded-lg bg-[rgba(201,168,76,0.08)] px-4 py-3 shadow-[inset_2px_0_0_#C9A84C]"
            >
              <span className="flex-1 font-sans text-[13px] font-medium text-cream">
                {c.name}
              </span>
              <span className="rounded-full border border-[#2A2A2A] bg-[#111111] px-2 py-0.5 font-sans text-[10px] text-gold">
                {c.type === "percentage" ? `${c.value}% off` : `£${c.value} off`}
              </span>
              <button
                type="button"
                onClick={() => setCodes((prev) => prev.filter((x) => x.id !== c.id))}
                className="cursor-pointer border-none bg-transparent p-0 text-base leading-none text-[#555555] hover:text-[#F87171]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mb-3.5 flex flex-col gap-2.5 rounded-lg border border-[#222222] bg-[#1A1A1A] p-3.5">
          <div>
            <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
              Code Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. EARLYBIRD10"
              className="otl-input w-full rounded-md border border-[#222222] bg-[#141414] px-3 py-2 font-sans text-[13px] text-cream outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
              Discount Type
            </label>
            <div className="flex gap-2.5">
              {[
                { key: "percentage", label: "% Percentage" },
                { key: "fixed", label: "£ Fixed" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className="flex-1 cursor-pointer rounded-md border px-3.5 py-2.5 font-sans text-xs transition-colors duration-150"
                  style={{
                    borderColor: type === opt.key ? "#C9A84C" : "#222222",
                    background: type === opt.key ? "rgba(201,168,76,0.08)" : "transparent",
                    color: type === opt.key ? "#C9A84C" : "#888888",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
              Discount Value
            </label>
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percentage" ? "10" : "5.00"}
              className="otl-input w-full rounded-md border border-[#222222] bg-[#141414] px-3 py-2 font-sans text-[13px] text-cream outline-none focus:border-gold"
            />
          </div>
          <div className="mt-1 flex gap-2">
            {(() => {
              const canAdd = name.trim() !== "" && Number(value) > 0;
              return (
                <button
                  type="button"
                  onClick={() => canAdd && addCode()}
                  disabled={!canAdd}
                  className="flex-1 cursor-pointer rounded-md border-none py-2 font-sans text-xs font-bold transition-colors duration-150 disabled:cursor-not-allowed"
                  style={{
                    background: canAdd ? "#C9A84C" : "#2A2A2A",
                    color: canAdd ? "#0A0A0A" : "#555555",
                  }}
                >
                  Add Code
                </button>
              );
            })()}
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 cursor-pointer rounded-md border border-[#222222] bg-transparent py-2 font-sans text-xs text-[#888888]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full cursor-pointer rounded-lg border-none bg-transparent py-2.5 font-sans text-[13px] text-[#888888] hover:text-gold"
        >
          + Add new code
        </button>
      )}
    </div>
  );
}

type PanelProps = {
  groups: DraftGroup[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string) => void;
  addGroup: () => void;
  deleteGroup: (id: string) => void;
  addTier: (groupId: string) => void;
  deleteTier: (groupId: string, tierId: string) => void;
  updateTier: (
    groupId: string,
    tierId: string,
    field: keyof DraftTier,
    value: string,
  ) => void;
  duplicateTier: (groupId: string, tierId: string) => void;
  moveTier: (groupId: string, tierId: string, direction: "up" | "down") => void;
  soldByTierId?: SoldMap;
  /** Existing tiers that cannot be edited or removed (edit-event mode). */
  lockedTierIds?: Set<string>;
  allowAddGroup?: boolean;
  showPromoCodes?: boolean;
};

export function TicketGroupsPanel({
  groups,
  activeGroupId,
  setActiveGroupId,
  addGroup,
  deleteGroup,
  addTier,
  deleteTier,
  updateTier,
  duplicateTier,
  moveTier,
  soldByTierId = {},
  lockedTierIds,
  allowAddGroup = true,
  showPromoCodes = true,
}: PanelProps) {
  const tierSold = (tier: DraftTier) => soldByTierId[tier.id] ?? 0;
  const groupSold = (g: DraftGroup) => g.tiers.some((t) => tierSold(t) > 0);

  const [openMenuTierId, setOpenMenuTierId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openMenuTierId == null) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuTierId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuTierId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <div className="grid grid-cols-1 items-start gap-[25px] xl:grid-cols-[260px_1fr]">
      <div className="flex flex-col gap-[25px]">
        <div className="rounded-[10px] p-[20px_18px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="font-sans text-sm font-semibold text-cream">Groups</span>
            <InfoTooltip text="Tickets move freely between tiers within a group as they sell out — but never across groups." />
          </div>
          <div className="mb-3.5 font-sans text-xs leading-relaxed text-[#888888]">
            Each group is a separate resale pool.
          </div>
          <div className="mb-3.5 flex flex-col gap-2">
            {groups.map((g) => {
              const active = activeGroupId === g.id;
              const gLocked = groupSold(g);
              return (
                <div
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-4 py-3 transition-colors duration-150"
                  style={{
                    background: active ? "rgba(201,168,76,0.08)" : "#1A1A1A",
                    boxShadow: active ? "inset 2px 0 0 #C9A84C" : "none",
                  }}
                >
                  <span className="text-[8px]" style={{ color: active ? "#C9A84C" : "#888888" }}>
                    ●
                  </span>
                  <span
                    className="flex-1 font-sans text-[13px] font-medium"
                    style={{ color: active ? "#F5F0E8" : "#888888" }}
                  >
                    {g.name}
                  </span>
                  <span className="font-sans text-[10px] text-gold">Own resale pool</span>
                  {allowAddGroup && groups.length > 1 && !gLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(g.id);
                      }}
                      className="cursor-pointer border-none bg-transparent p-0 text-base leading-none text-[#555555] hover:text-[#F87171]"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {allowAddGroup && (
            <button
              type="button"
              onClick={addGroup}
              className="w-full cursor-pointer rounded-lg border-none bg-transparent py-2.5 font-sans text-[13px] text-[#888888] hover:text-gold"
            >
              + Add new group
            </button>
          )}
        </div>
        {showPromoCodes && <PromoCodesSection />}
      </div>

      {activeGroup && (() => {
        const agLocked = groupSold(activeGroup);
        const canDeleteGroup = allowAddGroup && groups.length > 1 && !agLocked;

        return (
          <div className="rounded-[10px] p-[22px_24px]">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-sm text-gold">●●</span>
              <span className="flex-1 font-sans text-lg font-semibold text-cream">
                {activeGroup.name}
              </span>
              <button
                type="button"
                onClick={() => canDeleteGroup && deleteGroup(activeGroupId!)}
                disabled={!canDeleteGroup}
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center border-none bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F87171"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>

            <div className="mb-4 font-sans text-[13px] leading-relaxed text-[#888888]">
              Tickets in this group share one resale pool. When a lower tier sells out, resale
              listings move up. If a ticket resells for more, that extra goes to you, not a
              scalper.
            </div>

            <div className="mb-3.5 flex items-center justify-between">
              <span className="font-sans text-sm font-semibold text-cream">Tiers</span>
              <button
                type="button"
                onClick={() => addTier(activeGroupId!)}
                className="cursor-pointer rounded-md border-none bg-transparent px-3.5 py-1.5 font-sans text-xs text-[#888888] hover:text-gold"
              >
                + Add new tier
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {activeGroup.tiers.map((tier, i) => {
                const sold = tierSold(tier);
                const existingLocked = lockedTierIds?.has(tier.id) ?? false;
                const soldLocked = sold > 0;
                const locked = existingLocked || soldLocked;
                const menuOpen = openMenuTierId === tier.id;

                return (
                  <div
                    key={tier.id}
                    className="rounded-r-lg border-l-2 border-gold py-5 pr-6 pl-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-sans text-[11px] font-bold tracking-[0.12em] text-gold uppercase">
                        Tier {i + 1}
                      </span>
                      {!existingLocked && (
                        <div className="relative" ref={menuOpen ? menuRef : undefined}>
                          <button
                            type="button"
                            onClick={() => setOpenMenuTierId(menuOpen ? null : tier.id)}
                            className="cursor-pointer border-none bg-transparent p-0 text-lg"
                            style={{ color: menuOpen ? "#C9A84C" : "#888888" }}
                          >
                            ···
                          </button>
                          {menuOpen && (
                            <TierMenu
                              tier={tier}
                              index={i}
                              tierCount={activeGroup.tiers.length}
                              locked={soldLocked}
                              onDuplicate={() => {
                                duplicateTier(activeGroupId!, tier.id);
                                setOpenMenuTierId(null);
                              }}
                              onDelete={() => {
                                deleteTier(activeGroupId!, tier.id);
                                setOpenMenuTierId(null);
                              }}
                              onMoveUp={() => {
                                moveTier(activeGroupId!, tier.id, "up");
                                setOpenMenuTierId(null);
                              }}
                              onMoveDown={() => {
                                moveTier(activeGroupId!, tier.id, "down");
                                setOpenMenuTierId(null);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {(
                        [
                          { label: "Tier Name *", field: "name" as const, placeholder: "e.g. Early Bird" },
                          { label: "Quantity *", field: "quantity" as const, placeholder: "0" },
                          { label: "Price (£) *", field: "price" as const, placeholder: "0.00" },
                        ] as const
                      ).map(({ label, field, placeholder }) => {
                        const fieldLocked =
                          existingLocked || (soldLocked && field !== "quantity");
                        return (
                          <div key={field} className="flex flex-col gap-1.5">
                            <label className="font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
                              {label}
                            </label>
                            <input
                              type={field === "quantity" && soldLocked && !existingLocked ? "number" : "text"}
                              min={field === "quantity" && soldLocked && !existingLocked ? sold : undefined}
                              value={tier[field]}
                              onChange={(e) =>
                                updateTier(activeGroupId!, tier.id, field, e.target.value)
                              }
                              placeholder={placeholder}
                              disabled={fieldLocked}
                              className="w-full rounded-md border border-[#161616] px-3 py-2 font-sans text-[13px] text-cream outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">
                        Tier Closes
                      </label>
                      <input
                        value={tier.cutoff}
                        onChange={(e) =>
                          updateTier(activeGroupId!, tier.id, "cutoff", e.target.value)
                        }
                        placeholder="DD/MM/YYYY HH:MM"
                        disabled={existingLocked || soldLocked}
                        className="w-full rounded-md border border-[#161616] px-3 py-2 font-sans text-[13px] text-cream outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="mt-1 block font-sans text-[11px] text-[#555555]">
                        When this tier sells out, resale listings auto-promote to the next tier.
                        Leave blank for no cutoff.
                      </span>
                    </div>

                    {existingLocked && (
                      <div className="mt-2.5 font-sans text-[11px] text-[#555555]">
                        Existing tiers can&apos;t be edited. Add a new tier to change pricing or
                        capacity.
                      </div>
                    )}
                    {!existingLocked && soldLocked && (
                      <div className="mt-2.5 font-sans text-[11px] text-gold">
                        {sold} already sold — name, price and closing time are locked. Quantity can
                        only be increased.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
