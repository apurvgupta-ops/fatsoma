import { FatsomaClient } from "@fatsoma/api-client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const getDefaultBaseUrl = () => {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    return Platform.OS === "android"
      ? "http://10.0.2.2:3016"
      : "http://localhost:3016";
  }
  return "https://api.fatsoma.com";
};

let currentToken: string | null = null;

export const API_BASE_URL = getDefaultBaseUrl();

export const apiClient = new FatsomaClient({
  baseUrl: API_BASE_URL,
  getToken: () => currentToken,
});

export async function loadStoredToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync("accessToken");
  currentToken = token;
  return token;
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync("accessToken", access);
  await SecureStore.setItemAsync("refreshToken", refresh);
  currentToken = access;
}

export function clearTokens(): void {
  currentToken = null;
  SecureStore.deleteItemAsync("accessToken");
  SecureStore.deleteItemAsync("refreshToken");
}
