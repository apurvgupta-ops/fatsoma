export interface TicketBatch {
  name: string;
  quantity: number;
  basePrice: number;
  minDiscount: number;
  maxDiscount: number;
  entryWindowCutoff?: string | null;
  remaining?: number;
  resaleAvailable?: number;
  totalAvailableForPurchase?: number;
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
  role: "admin" | "staff" | "organizer" | "user";
  isActive: boolean;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingComplete: boolean;
  stripeConnectChargesEnabled: boolean;
  stripeConnectPayoutsEnabled: boolean;
  stripeConnectDetailsSubmitted: boolean;
  ownedEventCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff" | "organizer" | "user";
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
  isCurrentBatchSoldOut?: boolean;
  currentBatchRemaining?: number;
  resaleTargetBatchName?: string;
  resaleTargetBatchPrice?: number;
  eventDate: string | null;
  eventImage: string | null;
  venueName: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TicketScanReason =
  | "VALID"
  | "NOT_FOUND"
  | "WRONG_EVENT"
  | "ENTRY_WINDOW_CLOSED"
  | "ALREADY_USED"
  | "TICKET_NOT_ACTIVE"
  | "BUNDLE_EMPTY";

export interface TicketScanValidationInput {
  qrCode: string;
  eventId?: string;
}

export interface TicketScanValidationResult {
  valid: boolean;
  reason: TicketScanReason;
  message: string;
  scannedAt: string;
  ticket: {
    id: string;
    orderId?: string;
    eventId: string;
    userId?: string;
    eventName: string;
    ticketBatchName: string;
    status: "active" | "listed" | "transferred" | "used" | "cancelled";
    purchasePrice: number;
    usedAt?: string | null;
  } | null;
  entryWindowCutoff: string | null;
  holder?: {
    userId?: string;
    name: string | null;
    email: string | null;
  };
  order?: {
    id?: string;
    quantity: number;
    totalAmount: number;
    currency: string | null;
  };
  bundle?: {
    type: "bundle";
    orderId: string;
    userId: string;
    holderName: string | null;
    holderEmail: string | null;
    quantity: number;
    originalQuantity: number;
    priceEach: number;
    totalPrice: number;
    currency: string | null;
    ticketIds: string[];
    statusCounts: Record<string, number>;
  };
}

export interface ResaleListingResponse {
  id: string;
  ticketId: string;
  eventId: string;
  sellerId: string;
  eventName?: string | null;
  ticketBatchName?: string | null;
  askingPrice: number;
  originalTicketBatchName: string;
  originalPurchasePrice: number;
  targetTicketBatchName: string;
  reallocationType: "same_batch" | "upgraded_batch" | "sold_out_reallocated";
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
