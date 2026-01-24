import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Other tables here...

  guests: defineTable({
    attending: v.boolean(),
    email: v.string(),
    name: v.string(),
    plusOne: v.string(),
    messages: v.optional(v.array(v.string())),
  }),
});
