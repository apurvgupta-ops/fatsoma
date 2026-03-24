import { FatsomaClient } from "@fatsoma/api-client";
import EncryptedStorage from "react-native-encrypted-storage";
import { Platform } from "react-native";

const getDefaultBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === "android"
      ? "http://10.0.2.2:3016"
      : "http://localhost:3016";
  }
  return "https://api.fatsoma.com";
};

let currentToken: string | null = null;
let currentRefreshToken: string | null = null;
let authFailureCallback: (() => void) | null = null;

export const API_BASE_URL = getDefaultBaseUrl();

export const apiClient = new FatsomaClient({
  baseUrl: API_BASE_URL,
  getToken: () => currentToken,
  getRefreshToken: () => currentRefreshToken,
  onTokenRefreshed: (accessToken) => {
    currentToken = accessToken;
    EncryptedStorage.setItem("accessToken", accessToken);
  },
  onAuthFailure: () => {
    authFailureCallback?.();
  },
});

export function setOnAuthFailure(cb: () => void) {
  authFailureCallback = cb;
}

export async function loadStoredToken(): Promise<string | null> {
  const [token, refresh] = await Promise.all([
    EncryptedStorage.getItem("accessToken"),
    EncryptedStorage.getItem("refreshToken"),
  ]);
  currentToken = token ?? null;
  currentRefreshToken = refresh ?? null;
  return token ?? null;
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await EncryptedStorage.setItem("accessToken", access);
  await EncryptedStorage.setItem("refreshToken", refresh);
  currentToken = access;
  currentRefreshToken = refresh;
}

export function clearTokens(): void {
  currentToken = null;
  currentRefreshToken = null;
  EncryptedStorage.removeItem("accessToken");
  EncryptedStorage.removeItem("refreshToken");
}
