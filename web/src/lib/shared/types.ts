export interface TicketBatch {
  name: string;
  quantity: number;
  basePrice: number;
  minDiscount: number;
  maxDiscount: number;
  remaining?: number;
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
  bookingFee?: number;
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

export interface TicketResponse {
  id: string;
  orderId: string;
  eventId: string;
  userId: string;
  eventName: string;
  ticketBatchName: string;
  purchasePrice: number;
  originalPrice: number;
  status: "active" | "listed" | "transferred" | "used" | "cancelled";
  qrCode: string;
  allowResale: boolean;
  currentBatchPrice: number;
  eventDate: string | null;
  eventImage: string | null;
  venueName: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResaleListingResponse {
  id: string;
  ticketId: string;
  eventId: string;
  sellerId: string;
  askingPrice: number;
  originalPurchasePrice: number;
  status: "active" | "sold" | "cancelled" | "expired";
  buyerId: string | null;
  platformFee: number;
  sellerPayout: number;
  organiserRevenue: number;
  sellerRefundId: string | null;
  sellerRefundStatus: "pending" | "succeeded" | "failed" | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  type:
    | "order_paid"
    | "resale_sold"
    | "resale_bought"
    | "calendar_connected"
    | "system";
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
