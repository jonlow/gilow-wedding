import { query, mutation, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { optionalAuth, requireAuth } from "./lib/auth";

async function logGuestAuditEvent(
  ctx: MutationCtx,
  guestId: Id<"guests">,
  eventLabel: string,
  ipAddress?: string,
  city?: string,
  country?: string,
) {
  await ctx.db.insert("guestAuditEvents", {
    guestId,
    eventLabel,
    eventAt: Date.now(),
    ipAddress,
    city,
    country,
  });
}

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
      lastName: v.optional(v.string()),
      email: v.string(),
      secondaryEmail: v.optional(v.string()),
      slug: v.string(),
      plusOne: v.optional(v.string()),
      kids: v.optional(v.string()),
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
      kids: v.optional(v.string()),
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
          kids: guest.kids,
        }
      : null;
  },
});

export const submitGuestRsvp = mutation({
  args: {
    slug: v.string(),
    response: v.union(v.literal("yes"), v.literal("no")),
    ipAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
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
    const ipAddress = args.ipAddress?.trim();
    const city = args.city?.trim();
    const country = args.country?.trim();
    await logGuestAuditEvent(
      ctx,
      guest._id,
      "RSVP submitted",
      ipAddress ? ipAddress : undefined,
      city ? city : undefined,
      country ? country : undefined,
    );

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
    lastName: v.optional(v.string()),
    email: v.string(),
    secondaryEmail: v.optional(v.string()),
    slug: v.string(),
    plusOne: v.optional(v.string()),
    kids: v.optional(v.string()),
    attending: v.optional(v.boolean()),
    inviteSent: v.optional(v.boolean()),
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
      lastName: args.lastName,
      email: args.email,
      secondaryEmail: args.secondaryEmail,
      slug: args.slug,
      plusOne: args.plusOne,
      kids: args.kids,
      attending: args.attending,
      inviteSent: args.inviteSent ?? false,
    });

    await logGuestAuditEvent(ctx, guestId, "Guest created");

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
    lastName: v.optional(v.string()),
    email: v.string(),
    secondaryEmail: v.optional(v.string()),
    slug: v.string(),
    plusOne: v.optional(v.string()),
    kids: v.optional(v.string()),
    attending: v.optional(v.boolean()),
    inviteSent: v.optional(v.boolean()),
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
      lastName: args.lastName,
      email: args.email,
      secondaryEmail: args.secondaryEmail,
      slug: args.slug,
      plusOne: args.plusOne,
      kids: args.kids,
      attending: args.attending,
      inviteSent: args.inviteSent ?? false,
    });

    await logGuestAuditEvent(ctx, args.guestId, "Guest details updated");

    return {
      status: "updated" as const,
      duplicates: hasDuplicate ? duplicates : undefined,
    };
  },
});

export const bulkImportGuests = mutation({
  args: {
    token: v.string(),
    guests: v.array(
      v.object({
        name: v.string(),
        slug: v.string(),
        email: v.string(),
        plusOne: v.optional(v.string()),
        kids: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({
    importedCount: v.number(),
    skippedExistingEmailCount: v.number(),
    skippedDuplicateFileEmailCount: v.number(),
    skippedDuplicateSlugCount: v.number(),
    skippedInvalidCount: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    let importedCount = 0;
    let skippedExistingEmailCount = 0;
    let skippedDuplicateFileEmailCount = 0;
    let skippedDuplicateSlugCount = 0;
    let skippedInvalidCount = 0;

    const seenEmails = new Set<string>();

    for (const guest of args.guests) {
      const name = guest.name.trim();
      const slug = guest.slug.trim();
      const email = guest.email.trim().toLowerCase();
      const plusOne = guest.plusOne?.trim() || undefined;
      const kids = guest.kids?.trim() || undefined;

      if (!name || !slug || !email) {
        skippedInvalidCount += 1;
        continue;
      }

      if (seenEmails.has(email)) {
        skippedDuplicateFileEmailCount += 1;
        continue;
      }
      seenEmails.add(email);

      const existingByEmail = await ctx.db
        .query("guests")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      if (existingByEmail) {
        skippedExistingEmailCount += 1;
        continue;
      }

      const existingBySlug = await ctx.db
        .query("guests")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      if (existingBySlug) {
        skippedDuplicateSlugCount += 1;
        continue;
      }

      await ctx.db.insert("guests", {
        name,
        slug,
        email,
        plusOne,
        kids,
        inviteSent: false,
      });

      importedCount += 1;
    }

    return {
      importedCount,
      skippedExistingEmailCount,
      skippedDuplicateFileEmailCount,
      skippedDuplicateSlugCount,
      skippedInvalidCount,
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
    await logGuestAuditEvent(ctx, args.guestId, "Guest deleted");
    await ctx.db.delete(args.guestId);
    return null;
  },
});

export const markInviteSent = mutation({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
    ipAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
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
    const ipAddress = args.ipAddress?.trim();
    const city = args.city?.trim();
    const country = args.country?.trim();
    await logGuestAuditEvent(
      ctx,
      args.guestId,
      "Invite sent",
      ipAddress ? ipAddress : undefined,
      city ? city : undefined,
      country ? country : undefined,
    );

    return {
      ok: true,
      inviteSent: true,
    };
  },
});

export const listGuestAuditEvents = query({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
  },
  returns: v.array(
    v.object({
      _id: v.id("guestAuditEvents"),
      _creationTime: v.number(),
      guestId: v.id("guests"),
      eventLabel: v.string(),
      eventAt: v.number(),
      ipAddress: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const events = await ctx.db
      .query("guestAuditEvents")
      .withIndex("by_guestId_eventAt", (q) => q.eq("guestId", args.guestId))
      .order("desc")
      .collect();

    return events;
  },
});

export const clearGuestAuditEvents = mutation({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
  },
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const guest = await ctx.db.get(args.guestId);
    if (!guest) {
      throw new Error("Guest not found");
    }

    const auditEvents = await ctx.db
      .query("guestAuditEvents")
      .withIndex("by_guestId_eventAt", (q) => q.eq("guestId", args.guestId))
      .collect();

    await Promise.all(auditEvents.map((event) => ctx.db.delete(event._id)));

    return {
      deletedCount: auditEvents.length,
    };
  },
});

export const listLatestGuestAuditEvents = query({
  args: {
    token: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("guestAuditEvents"),
      guestId: v.id("guests"),
      guestName: v.string(),
      eventLabel: v.string(),
      eventAt: v.number(),
      ipAddress: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const events = await ctx.db
      .query("guestAuditEvents")
      .withIndex("by_eventAt")
      .order("desc")
      .collect();

    const latestEvents = events.slice(0, 200);

    return Promise.all(
      latestEvents.map(async (event) => {
        const guest = await ctx.db.get(event.guestId);
        const guestName = guest
          ? guest.lastName?.trim()
            ? `${guest.name} ${guest.lastName.trim()}`
            : guest.name
          : "Unknown guest";

        return {
          _id: event._id,
          guestId: event.guestId,
          guestName,
          eventLabel: event.eventLabel,
          eventAt: event.eventAt,
          ipAddress: event.ipAddress,
          city: event.city,
          country: event.country,
        };
      }),
    );
  },
});

export const addGuestAuditEvent = mutation({
  args: {
    token: v.string(),
    guestId: v.id("guests"),
    eventLabel: v.string(),
    ipAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);
    const label = args.eventLabel.trim();
    if (!label) {
      throw new Error("Event label is required");
    }

    const ipAddress = args.ipAddress?.trim();
    const city = args.city?.trim();
    const country = args.country?.trim();
    await logGuestAuditEvent(
      ctx,
      args.guestId,
      label,
      ipAddress ? ipAddress : undefined,
      city ? city : undefined,
      country ? country : undefined,
    );
    return { ok: true };
  },
});

export const logInvitePageViewed = mutation({
  args: {
    slug: v.string(),
    ipAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const guest = await ctx.db
      .query("guests")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!guest) {
      return { ok: false };
    }

    const ipAddress = args.ipAddress?.trim();
    const city = args.city?.trim();
    const country = args.country?.trim();
    await logGuestAuditEvent(
      ctx,
      guest._id,
      "Invite page viewed",
      ipAddress ? ipAddress : undefined,
      city ? city : undefined,
      country ? country : undefined,
    );

    return { ok: true };
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

export const resetGuestStateForTesting = internalMutation({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    totalGuests: v.number(),
    resetAttendingCount: v.number(),
    resetInviteSentCount: v.number(),
    deletedAuditEventCount: v.number(),
  }),
  handler: async (ctx) => {
    const [guests, auditEvents] = await Promise.all([
      ctx.db.query("guests").collect(),
      ctx.db.query("guestAuditEvents").collect(),
    ]);

    let resetAttendingCount = 0;
    let resetInviteSentCount = 0;

    await Promise.all(
      guests.map(async (guest) => {
        const patch: {
          attending?: boolean | undefined;
          inviteSent?: boolean;
        } = {};

        if (guest.attending !== undefined) {
          patch.attending = undefined;
          resetAttendingCount += 1;
        }

        if (guest.inviteSent) {
          patch.inviteSent = false;
          resetInviteSentCount += 1;
        }

        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(guest._id, patch);
        }
      }),
    );

    await Promise.all(auditEvents.map((event) => ctx.db.delete(event._id)));

    return {
      ok: true,
      totalGuests: guests.length,
      resetAttendingCount,
      resetInviteSentCount,
      deletedAuditEventCount: auditEvents.length,
    };
  },
});
