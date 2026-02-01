import { cookies } from "next/headers";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const SESSION_COOKIE_NAME = "dash_session";

/**
 * Get the session token from cookies
 */
export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Preload guests for SSR + real-time hydration
 */
export async function preloadGuests(token: string) {
  return preloadQuery(api.guests.listGuests, { token });
}
