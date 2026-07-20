"use client";

import { useState } from "react";
import { generateId, type DraftGroup, type DraftTier } from "./ticketTemplates";

export function useTicketGroups(initialGroups: DraftGroup[] = []) {
  const [groups, setGroups] = useState<DraftGroup[]>(initialGroups);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(
    initialGroups[0]?.id ?? null,
  );

  const addGroup = () => {
    const newGroup: DraftGroup = {
      id: generateId(),
      name: "New Group",
      tiers: [{ id: generateId(), name: "", quantity: "", price: "", cutoff: "" }],
    };
    setGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const deleteGroup = (id: string) => {
    setGroups((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      setActiveGroupId(updated[0]?.id ?? null);
      return updated;
    });
  };

  const addTier = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tiers: [
                ...g.tiers,
                { id: generateId(), name: "", quantity: "", price: "", cutoff: "" },
              ],
            }
          : g,
      ),
    );
  };

  const deleteTier = (groupId: string, tierId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tiers: g.tiers.filter((t) => t.id !== tierId) }
          : g,
      ),
    );
  };

  const updateTier = (
    groupId: string,
    tierId: string,
    field: keyof DraftTier,
    value: string,
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tiers: g.tiers.map((t) =>
                t.id === tierId ? { ...t, [field]: value } : t,
              ),
            }
          : g,
      ),
    );
  };

  const duplicateTier = (groupId: string, tierId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const idx = g.tiers.findIndex((t) => t.id === tierId);
        if (idx === -1) return g;
        const copy = { ...g.tiers[idx], id: generateId() };
        const tiers = [...g.tiers];
        tiers.splice(idx + 1, 0, copy);
        return { ...g, tiers };
      }),
    );
  };

  const moveTier = (
    groupId: string,
    tierId: string,
    direction: "up" | "down",
  ) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const idx = g.tiers.findIndex((t) => t.id === tierId);
        if (idx === -1) return g;
        const swapWith = direction === "up" ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= g.tiers.length) return g;
        const tiers = [...g.tiers];
        [tiers[idx], tiers[swapWith]] = [tiers[swapWith], tiers[idx]];
        return { ...g, tiers };
      }),
    );
  };

  return {
    groups,
    setGroups,
    activeGroupId,
    setActiveGroupId,
    addGroup,
    deleteGroup,
    addTier,
    deleteTier,
    updateTier,
    duplicateTier,
    moveTier,
  };
}
