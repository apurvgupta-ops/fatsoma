"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { UserResponse } from "@/lib/shared";
import { createApiClient, getStoredToken, storeTokens, clearTokens } from "./api";

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<UserResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  const loadUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setState({ user: null, token: null, loading: false });
      return;
    }

    try {
      const client = createApiClient(token);
      const res = await client.getMe();
      if (res.ok && res.data) {
        setState({ user: res.data, token, loading: false });
      } else {
        clearTokens();
        setState({ user: null, token: null, loading: false });
      }
    } catch {
      clearTokens();
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const client = createApiClient();
    const res = await client.login({ email, password });
    storeTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setState({ user: res.user, token: res.tokens.accessToken, loading: false });
    return res.user;
  };

  const logout = () => {
    clearTokens();
    setState({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

