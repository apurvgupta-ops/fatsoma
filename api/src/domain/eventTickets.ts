export interface ITicketBatch {
  name: string;
  quantity: number;
  basePrice: number;
  minDiscount: number;
  maxDiscount: number;
  entryWindowCutoff?: Date;
}

export interface ITicketGroup {
  title: string;
  sortOrder: number;
  batches: ITicketBatch[];
}

export type RawTicketGroup = {
  title?: string;
  sortOrder?: number;
  batches?: Partial<ITicketBatch>[];
};

function normalizeBatchCutoff(batch: Partial<ITicketBatch>): ITicketBatch {
  const cutoffRaw = batch?.entryWindowCutoff as unknown;
  const cutoffDate =
    typeof cutoffRaw === "string" && cutoffRaw.trim().length > 0
      ? new Date(cutoffRaw)
      : cutoffRaw instanceof Date
        ? cutoffRaw
        : undefined;

  return {
    name: String(batch.name ?? "").trim(),
    quantity: Number(batch.quantity ?? 0),
    basePrice: Number(batch.basePrice ?? 0),
    minDiscount: Number(batch.minDiscount ?? 0),
    maxDiscount: Number(batch.maxDiscount ?? 0),
    entryWindowCutoff:
      cutoffDate && !Number.isNaN(cutoffDate.getTime())
        ? cutoffDate
        : undefined,
  };
}

export function normalizeTicketGroups(
  groups: RawTicketGroup[] | undefined | null,
): ITicketGroup[] {
  if (!Array.isArray(groups) || groups.length === 0) return [];
  return groups.map((g, idx) => ({
    title: String(g.title ?? "").trim() || `Group ${idx + 1}`,
    sortOrder:
      typeof g.sortOrder === "number" && Number.isFinite(g.sortOrder)
        ? g.sortOrder
        : idx,
    batches: (Array.isArray(g.batches) ? g.batches : []).map(normalizeBatchCutoff),
  }));
}

export function ticketGroupsFromLegacyBatches(
  batches: Partial<ITicketBatch>[] | undefined | null,
): ITicketGroup[] {
  if (!Array.isArray(batches) || batches.length === 0) return [];
  return [
    {
      title: "Tickets",
      sortOrder: 0,
      batches: batches.map(normalizeBatchCutoff),
    },
  ];
}

export function ensureTicketGroups(event: {
  ticketGroups?: RawTicketGroup[] | ITicketGroup[] | null;
  ticketBatches?: Partial<ITicketBatch>[] | null;
}): ITicketGroup[] {
  const normalized = normalizeTicketGroups(
    event.ticketGroups as RawTicketGroup[] | undefined,
  );
  if (normalized.length > 0) {
    const hasBatches = normalized.some((g) => g.batches.length > 0);
    if (hasBatches) {
      return [...normalized].sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }
  return ticketGroupsFromLegacyBatches(event.ticketBatches ?? undefined);
}

export function flattenTicketBatchesFromEvent(event: {
  ticketGroups?: RawTicketGroup[] | ITicketGroup[] | null;
  ticketBatches?: Partial<ITicketBatch>[] | null;
}): ITicketBatch[] {
  const groups = ensureTicketGroups(event);
  const out: ITicketBatch[] = [];
  for (const g of groups) {
    for (const b of g.batches) out.push(b);
  }
  return out;
}

export type ResaleTargetBatchReallocationType =
  | "same_batch"
  | "upgraded_batch"
  | "sold_out_reallocated";

export type ComputeResaleTargetBatchResult = {
  targetTicketBatchName: string;
  reallocationType: ResaleTargetBatchReallocationType;
  targetBasePrice: number;
  /** Primary capacity remaining on the ticket's home batch (only > 0 for same_batch). */
  originalTierPrimaryRemaining: number;
};

/**
 * Where resale inventory should attach: only within the same ticket group as the
 * original batch. Upgrade to a higher tier in that group if it has primary left;
 * otherwise keep the original batch (reopens that tier for resale, never the next group).
 */
export function computeResaleTargetBatchInGroup(
  event: {
    ticketGroups?: RawTicketGroup[] | ITicketGroup[] | null;
    ticketBatches?: Partial<ITicketBatch>[] | null;
  },
  originalTicketBatchName: string,
  soldByBatch: Map<string, number>,
): ComputeResaleTargetBatchResult | null {
  const groups = ensureTicketGroups(event);
  let batches: ITicketBatch[] = [];
  let originalIndex = -1;

  for (const g of groups) {
    const idx = g.batches.findIndex((b) => b.name === originalTicketBatchName);
    if (idx >= 0) {
      batches = g.batches;
      originalIndex = idx;
      break;
    }
  }

  if (originalIndex < 0) {
    return null;
  }

  const remainingByBatch = batches.map((batch) =>
    Math.max(
      0,
      Number(batch.quantity ?? 0) - Number(soldByBatch.get(batch.name) || 0),
    ),
  );

  const originalBatch = batches[originalIndex]!;
  const originalRemaining = remainingByBatch[originalIndex] || 0;

  if (originalRemaining > 0) {
    return {
      targetTicketBatchName: originalBatch.name,
      reallocationType: "same_batch",
      targetBasePrice: Number(originalBatch.basePrice || 0),
      originalTierPrimaryRemaining: originalRemaining,
    };
  }

  for (let i = originalIndex + 1; i < batches.length; i += 1) {
    const batch = batches[i];
    if (batch && (remainingByBatch[i] || 0) > 0) {
      return {
        targetTicketBatchName: batch.name,
        reallocationType: "upgraded_batch",
        targetBasePrice: Number(batch.basePrice || 0),
        originalTierPrimaryRemaining: 0,
      };
    }
  }

  return {
    targetTicketBatchName: originalBatch.name,
    reallocationType: "sold_out_reallocated",
    targetBasePrice: Number(originalBatch.basePrice || 0),
    originalTierPrimaryRemaining: 0,
  };
}

export function assertValidTicketGroups(groups: ITicketGroup[]): void {
  if (groups.length === 0) {
    throw new Error("At least one ticket group is required");
  }
  const seenNames = new Set<string>();
  for (const g of groups) {
    if (!g.title?.trim()) {
      throw new Error("Each ticket group must have a title");
    }
    if (!g.batches?.length) {
      throw new Error(
        `Ticket group "${g.title}" must contain at least one slot (batch)`,
      );
    }
    for (const b of g.batches) {
      if (!b.name?.trim()) {
        throw new Error(`A slot in "${g.title}" is missing a name`);
      }
      if (seenNames.has(b.name)) {
        throw new Error(
          `Duplicate ticket slot name "${b.name}". Names must be unique across the whole event.`,
        );
      }
      seenNames.add(b.name);
      if (b.minDiscount > b.maxDiscount) {
        throw new Error(
          `Slot "${b.name}": minimum discount cannot exceed maximum discount`,
        );
      }
      if (b.basePrice <= 0) {
        throw new Error(`Slot "${b.name}": base price must be greater than 0`);
      }
      if (b.quantity < 0) {
        throw new Error(`Slot "${b.name}": quantity cannot be negative`);
      }
    }
  }
}

export function totalQuantityFromGroups(groups: ITicketGroup[]): number {
  return groups.reduce(
    (sum, g) => sum + g.batches.reduce((s, b) => s + b.quantity, 0),
    0,
  );
}
