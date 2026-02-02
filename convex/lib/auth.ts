import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Shared authentication helper for Convex functions.
 * Validates a session token and returns the authenticated user.
 *
 * @throws Error if the session is invalid or expired
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  token: string,
): Promise<{ user: Doc<"dashUsers">; session: Doc<"dashSessions"> }> {
  const session = await ctx.db
    .query("dashSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    throw new Error("Unauthorized");
  }

  return { user, session };
}

/**
 * Optional auth check - returns null instead of throwing if unauthorized.
 * Useful for endpoints that have different behavior for authenticated vs anonymous users.
 */
export async function optionalAuth(
  ctx: QueryCtx | MutationCtx,
  token: string | undefined,
): Promise<{ user: Doc<"dashUsers">; session: Doc<"dashSessions"> } | null> {
  if (!token) return null;

  const session = await ctx.db
    .query("dashSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    return null;
  }

  return { user, session };
}
