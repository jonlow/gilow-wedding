import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Other tables here...

  guests: defineTable({
    attending: v.optional(v.boolean()),
    inviteSent: v.optional(v.boolean()),
    email: v.string(),
    secondaryEmail: v.optional(v.string()),
    name: v.string(),
    lastName: v.optional(v.string()),
    slug: v.string(),
    plusOne: v.optional(v.string()),
    kids: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_email", ["email"]),

  guestAuditEvents: defineTable({
    guestId: v.id("guests"),
    eventLabel: v.string(),
    eventAt: v.number(),
    ipAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
  })
    .index("by_guestId", ["guestId"])
    .index("by_guestId_eventAt", ["guestId", "eventAt"])
    .index("by_eventAt", ["eventAt"]),

  // Dashboard users for authentication
  dashUsers: defineTable({
    username: v.string(),
    // In production, use proper hashing - this is a simple demo
    passwordHash: v.string(),
    displayName: v.string(),
    role: v.string(),
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  // Session tokens for authenticated users
  dashSessions: defineTable({
    userId: v.id("dashUsers"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),
});
