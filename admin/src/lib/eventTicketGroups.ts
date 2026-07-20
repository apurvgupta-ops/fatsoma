import type { EventResponse, TicketBatch, TicketGroup } from "@/lib/shared";
import { generateId, type DraftGroup } from "@/components/organiser/tickets/ticketTemplates";
import { parseTierCutoff } from "@/lib/eventDraft";

export function formatCutoffForInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

export function eventToDraftGroups(event: EventResponse): {
  groups: DraftGroup[];
  soldByTierId: Record<string, number>;
} {
  const soldByTierId: Record<string, number> = {};
  const sourceGroups: TicketGroup[] =
    event.ticketGroups?.length > 0
      ? event.ticketGroups
      : [
          {
            title: "General Admission",
            sortOrder: 0,
            batches: event.ticketBatches,
          },
        ];

  const groups: DraftGroup[] = sourceGroups.map((group) => ({
    id: generateId(),
    name: group.title,
    tiers: group.batches.map((batch) => {
      const id = generateId();
      const sold = Math.max(0, batch.quantity - (batch.remaining ?? 0));
      soldByTierId[id] = sold;
      return {
        id,
        name: batch.name,
        quantity: String(batch.quantity),
        price: Number(batch.basePrice).toFixed(2),
        cutoff: formatCutoffForInput(batch.entryWindowCutoff),
      };
    }),
  }));

  if (groups.length === 0) {
    const id = generateId();
    groups.push({
      id: generateId(),
      name: "General Admission",
      tiers: [{ id, name: "", quantity: "", price: "", cutoff: "" }],
    });
    soldByTierId[id] = 0;
  }

  return { groups, soldByTierId };
}

export function draftGroupsToTicketGroups(groups: DraftGroup[]): TicketGroup[] {
  return groups.map((g, idx) => ({
    title: g.name.trim() || `Group ${idx + 1}`,
    sortOrder: idx,
    batches: g.tiers
      .filter((t) => t.name.trim())
      .map(
        (t): TicketBatch => ({
          name: t.name.trim(),
          quantity: Math.max(0, Number(t.quantity) || 0),
          basePrice: Math.max(0, Number(t.price) || 0),
          minDiscount: 0,
          maxDiscount: 0,
          entryWindowCutoff: parseTierCutoff(t.cutoff),
        }),
      ),
  }));
}

export type OriginalBatchSnapshot = {
  name: string;
  quantity: number;
  basePrice: number;
  minDiscount: number;
  maxDiscount: number;
  entryWindowCutoff?: string | null;
};

export function snapshotOriginalBatches(
  groups: DraftGroup[],
  event: EventResponse,
): Record<string, OriginalBatchSnapshot> {
  const map: Record<string, OriginalBatchSnapshot> = {};
  const flatBatches =
    event.ticketGroups?.flatMap((g) => g.batches) ?? event.ticketBatches;
  const batchByName = new Map(flatBatches.map((b) => [b.name, b]));

  for (const g of groups) {
    for (const t of g.tiers) {
      const batch = batchByName.get(t.name);
      if (batch) {
        map[t.id] = {
          name: batch.name,
          quantity: batch.quantity,
          basePrice: batch.basePrice,
          minDiscount: batch.minDiscount ?? 0,
          maxDiscount: batch.maxDiscount ?? 0,
          entryWindowCutoff: batch.entryWindowCutoff,
        };
      }
    }
  }
  return map;
}

export function buildTicketGroupsForEditSave(
  groups: DraftGroup[],
  initialTierIds: Set<string>,
  originalBatchByTierId: Record<string, OriginalBatchSnapshot>,
): TicketGroup[] {
  return groups.map((g, idx) => ({
    title: g.name.trim() || `Group ${idx + 1}`,
    sortOrder: idx,
    batches: g.tiers
      .filter((t) => initialTierIds.has(t.id) || t.name.trim())
      .map((t): TicketBatch => {
        if (initialTierIds.has(t.id)) {
          const orig = originalBatchByTierId[t.id];
          if (!orig) {
            throw new Error(`Missing original batch for tier ${t.id}`);
          }
          return {
            name: orig.name,
            quantity: orig.quantity,
            basePrice: orig.basePrice,
            minDiscount: orig.minDiscount,
            maxDiscount: orig.maxDiscount,
            entryWindowCutoff: orig.entryWindowCutoff,
          };
        }
        return {
          name: t.name.trim(),
          quantity: Math.max(0, Number(t.quantity) || 0),
          basePrice: Math.max(0, Number(t.price) || 0),
          minDiscount: 0,
          maxDiscount: 0,
          entryWindowCutoff: parseTierCutoff(t.cutoff),
        };
      }),
  }));
}
