import type {
  ApiResponse,
  EventResponse,
  CreateEventInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  UserResponse,
  CreateUserInput,
  TicketResponse,
  ResaleListingResponse,
} from "@/lib/shared";

export interface ClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefreshed?: (accessToken: string) => void;
  onAuthFailure?: () => void;
}

export interface CheckoutOrder {
  id: string;
  eventName: string;
  ticketBatchName: string;
  quantity: number;
  basePrice: number;
  capturedBookingFee: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface OrderResponse {
  id: string;
  eventId: string;
  userId: string | null;
  eventName: string;
  ticketBatchName: string;
  quantity: number;
  basePrice: number;
  capturedBookingFee: number;
  totalAmount: number;
  currency: string;
  type: "primary" | "resale";
  resaleListingId: string | null;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  status: string;
  customerEmail: string | null;
  customerName: string | null;
  sellerPayout?: number;
  refundedAmount?: number;
  organiserRevenue?: number;
  originalPurchasePrice?: number;
  resaleListingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalFees: number;
  resaleOrders: number;
  resaleRevenue: number;
}

export class FatsomaClient {
  private baseUrl: string;
  private getToken: () => string | null;
  private getRefreshToken: () => string | null;
  private onTokenRefreshed?: (accessToken: string) => void;
  private onAuthFailure?: () => void;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getToken = config.getToken ?? (() => null);
    this.getRefreshToken = config.getRefreshToken ?? (() => null);
    this.onTokenRefreshed = config.onTokenRefreshed;
    this.onAuthFailure = config.onAuthFailure;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && !isRetry && !path.includes("/auth/refresh")) {
      const newToken = await this.tryRefresh();
      if (newToken) {
        return this.request<T>(path, options, true);
      }
      this.onAuthFailure?.();
    }

    if (!res.ok) {
      const body: any = await res.json().catch(() => ({}));
      throw new ApiError(
        body.message || `Request failed with status ${res.status}`,
        res.status,
        body,
      );
    }

    return res.json() as Promise<T>;
  }

  private async tryRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data: any = await res.json();
        const newToken: string | undefined =
          data.accessToken ?? data.data?.accessToken;
        if (newToken) {
          this.onTokenRefreshed?.(newToken);
          return newToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ── Auth ──────────────────────────────────────────────
  async register(input: RegisterInput): Promise<LoginResponse> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async login(input: LoginInput): Promise<LoginResponse> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe(): Promise<ApiResponse<UserResponse>> {
    return this.request("/api/auth/me");
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  // ── Events ────────────────────────────────────────────
  async getEvents(): Promise<ApiResponse<EventResponse[]>> {
    return this.request("/api/events");
  }

  async getPublishedEvents(): Promise<ApiResponse<EventResponse[]>> {
    return this.request("/api/events/published");
  }

  async getEvent(id: string): Promise<ApiResponse<EventResponse>> {
    return this.request(`/api/events/${id}`);
  }

  async createEvent(
    input: CreateEventInput,
  ): Promise<ApiResponse<EventResponse>> {
    return this.request("/api/events", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateEvent(
    id: string,
    input: Partial<CreateEventInput>,
  ): Promise<ApiResponse<EventResponse>> {
    return this.request(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async deleteEvent(id: string): Promise<ApiResponse> {
    return this.request(`/api/events/${id}`, { method: "DELETE" });
  }

  async updateEventStatus(
    id: string,
    status: "draft" | "published",
  ): Promise<ApiResponse<EventResponse>> {
    return this.request(`/api/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // ── Users (admin) ─────────────────────────────────────
  async getUsers(): Promise<ApiResponse<UserResponse[]>> {
    return this.request("/api/users");
  }

  async createUser(input: CreateUserInput): Promise<ApiResponse<UserResponse>> {
    return this.request("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<ApiResponse> {
    return this.request(`/api/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  }

  async updateUserRole(
    id: string,
    role: "admin" | "user",
  ): Promise<ApiResponse> {
    return this.request(`/api/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/api/users/${id}`, { method: "DELETE" });
  }

  // ── Checkout ────────────────────────────────────────────
  async createCheckoutSession(input: {
    eventId: string;
    batchName: string;
    quantity: number;
    capturedFee: number;
  }): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    return this.request("/api/checkout/create-session", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getCheckoutSession(
    sessionId: string,
  ): Promise<ApiResponse<CheckoutOrder>> {
    return this.request(`/api/checkout/session/${sessionId}`);
  }

  /** Verify payment with Stripe and update the order status. */
  async confirmCheckoutSession(
    sessionId: string,
  ): Promise<ApiResponse<CheckoutOrder>> {
    return this.request(`/api/checkout/session/${sessionId}/confirm`, {
      method: "POST",
    });
  }

  // ── Tickets ──────────────────────────────────────────────
  async getMyTickets(): Promise<ApiResponse<TicketResponse[]>> {
    return this.request("/api/tickets/my");
  }

  async getTicket(id: string): Promise<ApiResponse<TicketResponse>> {
    return this.request(`/api/tickets/${id}`);
  }

  // ── Resale ──────────────────────────────────────────────
  async listTicketForResale(input: {
    ticketId: string;
    askingPrice: number;
  }): Promise<ApiResponse<ResaleListingResponse>> {
    return this.request("/api/resale/list", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async cancelResaleListing(
    id: string,
  ): Promise<ApiResponse<ResaleListingResponse>> {
    return this.request(`/api/resale/${id}`, { method: "DELETE" });
  }

  async getMyResaleListings(): Promise<ApiResponse<ResaleListingResponse[]>> {
    return this.request("/api/resale/my");
  }

  async getResaleListings(
    eventId: string,
  ): Promise<ApiResponse<ResaleListingResponse[]>> {
    return this.request(`/api/resale/event/${eventId}`);
  }

  async buyResaleTicket(
    listingId: string,
    capturedFee: number,
  ): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    return this.request(`/api/resale/${listingId}/buy`, {
      method: "POST",
      body: JSON.stringify({ capturedFee }),
    });
  }

  // ── Orders ─────────────────────────────────────────────
  async getMyOrders(): Promise<ApiResponse<OrderResponse[]>> {
    return this.request("/api/orders/my");
  }

  async getOrders(params?: {
    status?: string;
    type?: string;
    eventId?: string;
    search?: string;
  }): Promise<ApiResponse<OrderResponse[]>> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.type) qs.set("type", params.type);
    if (params?.eventId) qs.set("eventId", params.eventId);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return this.request(`/api/orders${query ? `?${query}` : ""}`);
  }

  async getOrderStats(): Promise<ApiResponse<OrderStats>> {
    return this.request("/api/orders/stats");
  }

  // ── Upload ────────────────────────────────────────────
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}/api/uploads`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body: any = await res.json().catch(() => ({}));
      throw new ApiError(body.message || "Upload failed", res.status, body);
    }

    return res.json() as Promise<ApiResponse<{ url: string }>>;
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
