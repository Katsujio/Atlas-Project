import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/client";
import { AuthResponse } from "../api/types";
import {
  StoredUser,
  clearSession,
  getStoredTokens,
  getStoredUser,
  storeTokens,
  storeUser,
} from "../utils/auth-storage";

type AuthContextValue = {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens.accessToken || !tokens.refreshToken) {
      setIsLoading(false);
      return;
    }
    const existingUser = getStoredUser();
    if (existingUser) {
      setUser(existingUser);
      setIsLoading(false);
      return;
    }
    try {
      const response = await api.get<StoredUser>("/auth/me");
      setUser(response.data);
      storeUser(response.data);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const handleAuthSuccess = useCallback((authResponse: AuthResponse) => {
    const { user: nextUser, tokens } = authResponse;
    storeTokens(tokens.access_token, tokens.refresh_token);
    storeUser(nextUser);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      handleAuthSuccess(response.data);
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/register", {
        email,
        password,
      });
      handleAuthSuccess(response.data);
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
