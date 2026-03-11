import { FatsomaClient } from "@fatsoma/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3016";

export function createPublicClient() {
  return new FatsomaClient({ baseUrl: API_BASE_URL });
}

export function createAuthClient(token: string) {
  return new FatsomaClient({
    baseUrl: API_BASE_URL,
    getToken: () => token,
  });
}

export function createBrowserClient() {
  return new FatsomaClient({
    baseUrl: API_BASE_URL,
    getToken: () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("accessToken");
    },
  });
}
