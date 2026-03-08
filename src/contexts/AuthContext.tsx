import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "@/lib/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("swipebuddy_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("swipebuddy_token")
  );
  const [isLoading, setIsLoading] = useState(false);

  const persistAuth = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem("swipebuddy_token", token);
    localStorage.setItem("swipebuddy_user", JSON.stringify(user));
    setToken(token);
    setUserState(user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const res = await api.post("/auth/login", { email, password });
        const { user, token } = res.data.data;
        persistAuth(user, token);
      } finally {
        setIsLoading(false);
      }
    },
    [persistAuth]
  );

  const signup = useCallback(
    async (data: { name: string; email: string; password: string; phone: string }) => {
      setIsLoading(true);
      try {
        const res = await api.post("/auth/signup", data);
        const { user, token } = res.data.data;
        persistAuth(user, token);
        return user as AuthUser;
      } finally {
        setIsLoading(false);
      }
    },
    [persistAuth]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("swipebuddy_token");
    localStorage.removeItem("swipebuddy_user");
    setToken(null);
    setUserState(null);
    window.location.href = "/";
  }, []);

  const setUser = useCallback((user: AuthUser) => {
    setUserState(user);
    localStorage.setItem("swipebuddy_user", JSON.stringify(user));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
