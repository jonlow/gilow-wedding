"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoginForm } from "./login-form";
import { Dashboard } from "./dashboard";

const SESSION_TOKEN_KEY = "dash_session_token";

export default function DashPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  // Validate the session token
  const sessionResult = useQuery(
    api.auth.validateSession,
    token ? { token } : "skip",
  );

  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  const handleLogin = async (username: string, password: string) => {
    const result = await loginMutation({ username, password });
    if (result.success) {
      localStorage.setItem(SESSION_TOKEN_KEY, result.token);
      setToken(result.token);
      return { success: true as const };
    }
    return { success: false as const, error: result.error };
  };

  const handleLogout = async () => {
    if (token) {
      await logoutMutation({ token });
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setToken(null);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if user is authenticated
  const isAuthenticated = sessionResult?.valid === true;

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard user={sessionResult.user} onLogout={handleLogout} />;
}
