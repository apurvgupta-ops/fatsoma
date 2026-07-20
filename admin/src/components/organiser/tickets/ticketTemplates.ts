export const generateId = () => Math.random().toString(36).slice(2, 9);

export type DraftTier = {
  id: string;
  name: string;
  quantity: string;
  price: string;
  cutoff: string;
};

export type DraftGroup = {
  id: string;
  name: string;
  tiers: DraftTier[];
};

export const TICKET_TEMPLATES: Record<
  string,
  { label: string; desc: string; groups: DraftGroup[] }
> = {
  general: {
    label: "General Admission",
    desc: "Single entry pool with price tiers",
    groups: [
      {
        id: "g1",
        name: "General Admission",
        tiers: [
          { id: "t1", name: "Early Bird", quantity: "100", price: "15.00", cutoff: "" },
          { id: "t2", name: "Standard", quantity: "100", price: "22.00", cutoff: "" },
          { id: "t3", name: "Final Release", quantity: "50", price: "30.00", cutoff: "" },
        ],
      },
    ],
  },
  vip: {
    label: "VIP",
    desc: "Separate pricing and resale pool",
    groups: [
      {
        id: "g1",
        name: "General",
        tiers: [
          { id: "t1", name: "Early Bird", quantity: "200", price: "15.00", cutoff: "" },
          { id: "t2", name: "Standard", quantity: "200", price: "22.00", cutoff: "" },
        ],
      },
      {
        id: "g2",
        name: "VIP",
        tiers: [
          { id: "t3", name: "VIP Early", quantity: "50", price: "45.00", cutoff: "" },
          { id: "t4", name: "VIP Standard", quantity: "50", price: "60.00", cutoff: "" },
        ],
      },
    ],
  },
  malefemale: {
    label: "Male / Female",
    desc: "Two groups, two separate resale pools",
    groups: [
      {
        id: "g1",
        name: "Male",
        tiers: [
          { id: "t1", name: "Early Bird", quantity: "100", price: "15.00", cutoff: "" },
          { id: "t2", name: "Standard", quantity: "100", price: "25.00", cutoff: "" },
          { id: "t3", name: "Final Release", quantity: "100", price: "35.00", cutoff: "" },
        ],
      },
      {
        id: "g2",
        name: "Female",
        tiers: [
          { id: "t4", name: "Early Bird", quantity: "100", price: "10.00", cutoff: "" },
          { id: "t5", name: "Standard", quantity: "100", price: "18.00", cutoff: "" },
          { id: "t6", name: "Final Release", quantity: "100", price: "25.00", cutoff: "" },
        ],
      },
    ],
  },
  custom: {
    label: "Custom",
    desc: "Start from scratch",
    groups: [
      {
        id: "g1",
        name: "Group 1",
        tiers: [{ id: "t1", name: "", quantity: "", price: "", cutoff: "" }],
      },
    ],
  },
};

export function cloneGroups(groups: DraftGroup[]): DraftGroup[] {
  return groups.map((g) => ({
    ...g,
    id: generateId(),
    tiers: g.tiers.map((t) => ({ ...t, id: generateId() })),
  }));
}
