import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { UserResponse } from "@fatsoma/shared";
import { apiClient, loadStoredToken, setTokens, clearTokens, setOnAuthFailure } from "../lib/api";

interface AuthState {
  user: UserResponse | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  const loadUser = useCallback(async () => {
    const token = await loadStoredToken();
    if (!token) {
      setState({ user: null, loading: false });
      return;
    }
    try {
      const res = await apiClient.getMe();
      if (res.ok && res.data) {
        setState({ user: res.data, loading: false });
      } else {
        await clearTokens();
        setState({ user: null, loading: false });
      }
    } catch {
      await clearTokens();
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.login({ email, password });
    await setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setState({ user: res.user, loading: false });
  };

  const register = async (input: {
    name: string;
    email: string;
    password: string;
  }) => {
    const res = await apiClient.register(input);
    await setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setState({ user: res.user, loading: false });
  };

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, loading: false });
  }, []);

  useEffect(() => {
    setOnAuthFailure(logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
