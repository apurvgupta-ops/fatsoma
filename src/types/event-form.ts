export type TicketBatch = {
  name: string;
  quantity: number;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
};

export type EventFormValues = {
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  eventImage: FileList;
  eventBanner?: FileList;
  venueName: string;
  addressLine: string;
  city: string;
  postcode: string;
  country: string;
  mapsLink?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  totalTickets: number;
  ticketBatches: TicketBatch[];
  dynamicPricing: boolean;
  bookingFee: number;
  allowResale: boolean;
  platformCommission: number;
};

export type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

export type TicketTotals = {
  tickets: number;
  minRevenue: number;
  maxRevenue: number;
};
