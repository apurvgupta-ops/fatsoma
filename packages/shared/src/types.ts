export interface TicketBatch {
  name: string;
  quantity: number;
  basePrice: number;
  minDiscount: number;
  maxDiscount: number;
}

export interface EventBase {
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  eventImage: string;
  eventBanner?: string;
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
}

export interface EventResponse extends EventBase {
  id: string;
  status: "draft" | "published";
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput extends EventBase {
  status: "draft" | "published";
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

export interface ApiResponse<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

export interface TicketTotals {
  tickets: number;
  minRevenue: number;
  maxRevenue: number;
}
