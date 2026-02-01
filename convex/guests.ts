import { query } from "./_generated/server";
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
