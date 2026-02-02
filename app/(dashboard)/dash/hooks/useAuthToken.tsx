"use client";

import { createContext, useContext, type ReactNode } from "react";

interface AuthContextValue {
  token: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  token: string;
  children: ReactNode;
}

/**
 * Provides the auth token to all dashboard components via context.
 * Wrap your dashboard layout or page with this provider to avoid prop drilling.
 */
export function AuthProvider({ token, children }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ token }}>{children}</AuthContext.Provider>
  );
}

/**
 * Hook to access the auth token from context.
 * Must be used within an AuthProvider.
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuthToken(): string {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthToken must be used within an AuthProvider");
  }
  return context.token;
}
