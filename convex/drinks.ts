import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { optionalAuth, requireAuth } from "./lib/auth";
import { drinkProfile } from "./schema";

export const list = query({
  args: { token: v.string(), guestIds: v.array(v.id("guests")) },
  returns: v.array(
    v.object({
      guestId: v.id("guests"),
      main: v.optional(drinkProfile),
      partner: v.optional(drinkProfile),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await optionalAuth(ctx, args.token))) return [];
    if (args.guestIds.length > 250)
      throw new Error("Request at most 250 households at a time");
    return await Promise.all(
      [...new Set(args.guestIds)].map(async (guestId) => {
        const [guest, record] = await Promise.all([
          ctx.db.get(guestId),
          ctx.db
            .query("guestDrinks")
            .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
            .unique(),
        ]);
        return {
          guestId,
          ...(guest && record?.main ? { main: record.main } : {}),
          ...(guest?.plusOne?.trim() && record?.partner
            ? { partner: record.partner }
            : {}),
        };
      }),
    );
  },
});

export const savePerson = mutation({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
    person: v.union(v.literal("main"), v.literal("partner")),
    expectedPartner: v.optional(v.string()),
    profile: drinkProfile,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error("Guest not found");
    if (args.person === "partner" && !guest.plusOne?.trim())
      throw new Error("This household has no plus one");
    if (args.person === "partner" && args.expectedPartner?.trim() !== guest.plusOne?.trim()) {
      throw new Error("The plus one has changed. Refresh before saving their drinks details.");
    }
    const { score } = args.profile;
    if (
      score !== undefined &&
      (!Number.isInteger(score) || score < 0 || score > 10)
    ) {
      throw new Error("Choose a whole-number score from 0 to 10");
    }
    const profile = {
      ...(score !== undefined ? { score } : {}),
      preferences: score === 0 ? [] : [...new Set(args.profile.preferences)],
    };
    const record = await ctx.db
      .query("guestDrinks")
      .withIndex("by_guestId", (q) => q.eq("guestId", args.guestId))
      .unique();
    if (record) {
      await ctx.db.patch(record._id, { [args.person]: profile });
    } else {
      await ctx.db.insert("guestDrinks", {
        guestId: args.guestId,
        [args.person]: profile,
      });
    }
    return null;
  },
});

export const copyToPartner = mutation({
  args: { token: v.string(), guestId: v.id("guests"), expectedPartner: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error("Guest not found");
    if (!guest.plusOne?.trim())
      throw new Error("This household has no plus one");
    if (args.expectedPartner?.trim() !== guest.plusOne.trim()) {
      throw new Error("The plus one has changed. Refresh before copying drinks details.");
    }
    const record = await ctx.db
      .query("guestDrinks")
      .withIndex("by_guestId", (q) => q.eq("guestId", args.guestId))
      .unique();
    if (!record?.main)
      throw new Error("Enter the main guest's drinking details first");
    await ctx.db.patch(record._id, { partner: record.main });
    return null;
  },
});
