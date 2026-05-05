export type TicketTypePresetId =
  | "general_admission"
  | "vip"
  | "queue_jump"
  | "male_female"
  | "custom";

export type TicketTypePreset = {
  id: TicketTypePresetId;
  title: string;
  description: string;
  addsTypesBadge?: string;
  groupTitleSuggestion: string;
  mode: "single" | "dual";
  /** Prefills the slot name for single-mode presets */
  defaultSlotName?: string;
};

export const TICKET_TYPE_PRESETS: TicketTypePreset[] = [
  {
    id: "general_admission",
    title: "General Admission",
    description: "Single entry pool with price tiers",
    groupTitleSuggestion: "General admission",
    mode: "single",
    defaultSlotName: "",
  },
  {
    id: "vip",
    title: "VIP",
    description: "Separate pricing and resale pool",
    groupTitleSuggestion: "VIP",
    mode: "single",
    defaultSlotName: "VIP",
  },
  {
    id: "queue_jump",
    title: "Queue Jump",
    description: "Priority entry, own resale pool",
    groupTitleSuggestion: "Queue Jump",
    mode: "single",
    defaultSlotName: "Queue Jump",
  },
  {
    id: "male_female",
    title: "Male / Female",
    description: "Creates two separate resale pools",
    addsTypesBadge: "Adds 2 types",
    groupTitleSuggestion: "Male / Female",
    mode: "dual",
  },
  {
    id: "custom",
    title: "Custom",
    description: "Start from scratch",
    groupTitleSuggestion: "",
    mode: "single",
    defaultSlotName: "",
  },
];
