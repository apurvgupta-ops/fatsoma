import { FatsomaClient } from "@fatsoma/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://onthelistapp.24livehost.com:3016";

export function createApiClient(token?: string | null) {
  return new FatsomaClient({
    baseUrl: API_BASE_URL,
    getToken: () => token ?? null,
  });
}

const TOKEN_KEY = "fatsoma_access_token";
const REFRESH_KEY = "fatsoma_refresh_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
