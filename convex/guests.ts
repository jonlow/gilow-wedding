import { query, mutation, internalMutation } from "./_generated/server";
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
      inviteSent: v.boolean(),
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
    const guests = await ctx.db.query("guests").collect();
    return guests.map((guest) => ({
      ...guest,
      inviteSent: guest.inviteSent ?? false,
    }));
  },
});

export const getGuestBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("guests"),
      name: v.string(),
      slug: v.string(),
      attending: v.optional(v.boolean()),
      plusOne: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const guest = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return guest
      ? {
          _id: guest._id,
          name: guest.name,
          slug: guest.slug,
          attending: guest.attending,
          plusOne: guest.plusOne,
        }
      : null;
  },
});

export const submitGuestRsvp = mutation({
  args: {
    slug: v.string(),
    response: v.union(v.literal("yes"), v.literal("no")),
  },
  returns: v.object({
    ok: v.boolean(),
    attending: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const guest = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!guest) {
      throw new Error("Guest not found");
    }

    const attending = args.response === "yes";
    await ctx.db.patch(guest._id, { attending });

    return {
      ok: true,
      attending,
    };
  },
});

export const addGuest = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    slug: v.string(),
    plusOne: v.optional(v.string()),
    attending: v.optional(v.boolean()),
    inviteSent: v.optional(v.boolean()),
    messages: v.optional(v.array(v.string())),
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
      attending: args.attending,
      inviteSent: args.inviteSent ?? false,
      messages: args.messages,
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
    attending: v.optional(v.boolean()),
    inviteSent: v.optional(v.boolean()),
    messages: v.optional(v.array(v.string())),
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
      attending: args.attending,
      inviteSent: args.inviteSent ?? false,
      messages: args.messages,
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

export const markInviteSent = mutation({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
  },
  returns: v.object({
    ok: v.boolean(),
    inviteSent: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const guest = await ctx.db.get(args.guestId);
    if (!guest) {
      throw new Error("Guest not found");
    }

    await ctx.db.patch(args.guestId, { inviteSent: true });

    return {
      ok: true,
      inviteSent: true,
    };
  },
});

export const resetAllGuestRsvpsForTesting = internalMutation({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    totalGuests: v.number(),
    resetCount: v.number(),
  }),
  handler: async (ctx) => {
    const guests = await ctx.db.query("guests").collect();

    let resetCount = 0;
    await Promise.all(
      guests.map(async (guest) => {
        if (guest.attending !== undefined) {
          await ctx.db.patch(guest._id, { attending: undefined });
          resetCount += 1;
        }
      }),
    );

    return {
      ok: true,
      totalGuests: guests.length,
      resetCount,
    };
  },
});
