"use server";

import { cookies } from "next/headers";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const SESSION_COOKIE_NAME = "dash_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: number;
};

export type AuthResult =
  | { authenticated: true; user: AuthUser }
  | { authenticated: false };

/**
 * Get the current session from cookies and validate it
 */
export async function getSession(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return { authenticated: false };
  }

  try {
    const result = await fetchQuery(api.auth.validateSession, { token });

    if (result.valid) {
      return {
        authenticated: true,
        user: {
          id: result.user.id,
          username: result.user.username,
          displayName: result.user.displayName,
          role: result.user.role,
          createdAt: result.user.createdAt,
        },
      };
    }

    // Invalid session - clear the cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Login with username and password
 */
export async function login(
  username: string,
  password: string,
): Promise<
  { success: true; user: AuthUser } | { success: false; error: string }
> {
  const result = await fetchMutation(api.auth.login, { username, password });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return {
    success: true,
    user: {
      id: result.user.id,
      username: result.user.username,
      displayName: result.user.displayName,
      role: result.user.role,
      createdAt: Date.now(),
    },
  };
}

/**
 * Logout - clear the session
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await fetchMutation(api.auth.logout, { token });
    } catch {
      // Ignore errors during logout
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
