import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalAuth, requireAuth } from "./lib/auth";

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
    const auth = await optionalAuth(ctx, args.token);
    if (!auth) {
      return [];
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
    force: v.optional(v.boolean()),
  },
  returns: v.object({
    status: v.union(v.literal("created"), v.literal("duplicate")),
    guestId: v.optional(v.id("guests")),
    duplicates: v.optional(
      v.object({
        slug: v.optional(v.boolean()),
        email: v.optional(v.boolean()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    // Uniqueness checks using schema indexes
    const [existingSlug, existingEmail] = await Promise.all([
      ctx.db
        .query("guests")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .unique(),
      ctx.db
        .query("guests")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .unique(),
    ]);

    const duplicates = {
      slug: existingSlug ? true : undefined,
      email: existingEmail ? true : undefined,
    } as const;

    const hasDuplicate = Boolean(duplicates.slug || duplicates.email);

    if (hasDuplicate && !args.force) {
      return {
        status: "duplicate" as const,
        guestId: undefined,
        duplicates,
      };
    }

    // Create the guest
    const guestId = await ctx.db.insert("guests", {
      name: args.name,
      email: args.email,
      slug: args.slug,
      plusOne: args.plusOne,
    });

    return {
      status: "created" as const,
      guestId,
      duplicates: hasDuplicate ? duplicates : undefined,
    };
  },
});

export const updateGuest = mutation({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
    name: v.string(),
    email: v.string(),
    slug: v.string(),
    plusOne: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  returns: v.object({
    status: v.union(v.literal("updated"), v.literal("duplicate")),
    duplicates: v.optional(
      v.object({
        slug: v.optional(v.boolean()),
        email: v.optional(v.boolean()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const guest = await ctx.db.get(args.guestId);
    if (!guest) {
      throw new Error("Guest not found");
    }

    // Uniqueness checks - only check if value changed
    const [existingSlug, existingEmail] = await Promise.all([
      args.slug !== guest.slug
        ? ctx.db
            .query("guests")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .unique()
        : null,
      args.email !== guest.email
        ? ctx.db
            .query("guests")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique()
        : null,
    ]);

    const duplicates = {
      slug: existingSlug ? true : undefined,
      email: existingEmail ? true : undefined,
    } as const;

    const hasDuplicate = Boolean(duplicates.slug || duplicates.email);

    if (hasDuplicate && !args.force) {
      return {
        status: "duplicate" as const,
        duplicates,
      };
    }

    // Update the guest
    await ctx.db.patch(args.guestId, {
      name: args.name,
      email: args.email,
      slug: args.slug,
      plusOne: args.plusOne,
    });

    return {
      status: "updated" as const,
      duplicates: hasDuplicate ? duplicates : undefined,
    };
  },
});

export const deleteGuest = mutation({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);
    await ctx.db.delete(args.guestId);
    return null;
  },
});
