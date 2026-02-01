import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listGuests = query({
  args: {
    token: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("guests"),
      _creationTime: v.number(),
      attending: v.optional(v.boolean()),
      name: v.string(),
      email: v.string(),
      slug: v.string(),
      plusOne: v.optional(v.string()),
      messages: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("dashSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.query("guests").collect();
  },
});

export const addGuest = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    slug: v.string(),
    plusOne: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const session = await ctx.db
      .query("dashSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Create the guest
    const guestId = await ctx.db.insert("guests", {
      name: args.name,
      email: args.email,
      slug: args.slug,
      plusOne: args.plusOne,
    });

    return guestId;
  },
});
