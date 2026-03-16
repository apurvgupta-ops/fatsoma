import { FatsomaClient } from "@fatsoma/api-client";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:4000"
  : "https://api.fatsoma.com";

export const apiClient = new FatsomaClient({
  baseUrl: API_BASE_URL,
  getToken: () => {
    try {
      return SecureStore.getItem("accessToken");
    } catch {
      return null;
    }
  },
});

export const setTokens = async (access: string, refresh: string) => {
  await SecureStore.setItemAsync("accessToken", access);
  await SecureStore.setItemAsync("refreshToken", refresh);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
};

export const getRefreshToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync("refreshToken");
};
