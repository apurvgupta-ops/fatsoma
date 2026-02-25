import type {
  ApiResponse,
  EventResponse,
  CreateEventInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  UserResponse,
  CreateUserInput,
} from "@fatsoma/shared";

export interface ClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
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

export class FatsomaClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getToken = config.getToken ?? (() => null);
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
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

  async createUser(
    input: CreateUserInput,
  ): Promise<ApiResponse<UserResponse>> {
    return this.request("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateUserStatus(
    id: string,
    isActive: boolean,
  ): Promise<ApiResponse> {
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
  }): Promise<ApiResponse<{ sessionId: string; url: string; orderId: string }>> {
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
      throw new ApiError(
        body.message || "Upload failed",
        res.status,
        body,
      );
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
