import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { Noto_Sans_Telugu } from "next/font/google";

export default defineSchema({
  // Other tables here...

  guests: defineTable({
    attending: v.boolean(),
    email: v.string(),
    name: v.string(),
    slug: v.string(),
    plusOne: v.string(),
    messages: v.optional(v.array(v.string())),
  }),

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
