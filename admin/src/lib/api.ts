import { FatsomaClient } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

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

export function createApiClient(token?: string | null) {
  return new FatsomaClient({
    baseUrl: API_BASE_URL,
    getToken: () => token ?? getStoredToken(),
    getRefreshToken: () => getStoredRefreshToken(),
    onTokenRefreshed: (accessToken) => {
      localStorage.setItem(TOKEN_KEY, accessToken);
    },
    onAuthFailure: () => {
      clearTokens();
      window.location.href = "/login";
    },
  });
}

