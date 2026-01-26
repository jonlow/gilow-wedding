import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Simple hash function for demo purposes.
 * In production, use a proper password hashing library like bcrypt via an action.
 */
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Generate a random session token
 */
function generateToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Login with username and password
 */
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      token: v.string(),
      user: v.object({
        id: v.id("dashUsers"),
        username: v.string(),
        displayName: v.string(),
        role: v.string(),
      }),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("dashUsers")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return { success: false as const, error: "Invalid username or password" };
    }

    const passwordHash = simpleHash(args.password);
    if (user.passwordHash !== passwordHash) {
      return { success: false as const, error: "Invalid username or password" };
    }

    // Create a session token (expires in 24 hours)
    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.db.insert("dashSessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    return {
      success: true as const,
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  },
});

/**
 * Logout - invalidate a session token
 */
export const logout = mutation({
  args: {
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("dashSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return null;
  },
});

/**
 * Validate a session token and get user info
 */
export const validateSession = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      valid: v.literal(true),
      user: v.object({
        id: v.id("dashUsers"),
        username: v.string(),
        displayName: v.string(),
        role: v.string(),
        createdAt: v.number(),
      }),
    }),
    v.object({
      valid: v.literal(false),
    }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("dashSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) {
      return { valid: false as const };
    }

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      // Session expired - we can't delete in a query, but we return invalid
      return { valid: false as const };
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return { valid: false as const };
    }

    return {
      valid: true as const,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  },
});

/**
 * Internal mutation to seed a demo user
 */
export const seedDemoUser = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if demo user already exists
    const existingUser = await ctx.db
      .query("dashUsers")
      .withIndex("by_username", (q) => q.eq("username", "gilow"))
      .unique();

    if (!existingUser) {
      await ctx.db.insert("dashUsers", {
        username: "gilow",
        passwordHash: simpleHash("we_love_murphy"),
        displayName: "Admin User",
        role: "admin",
        createdAt: Date.now(),
      });
      console.log("Demo user created: gilow");
    } else {
      console.log("Demo user already exists");
    }

    return null;
  },
});

/**
 * Public mutation to create the demo user (call once to set up)
 */
export const createDemoUser = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Check if demo user already exists
    const existingUser = await ctx.db
      .query("dashUsers")
      .withIndex("by_username", (q) => q.eq("username", "gilow"))
      .unique();

    if (existingUser) {
      return "Demo user already exists.";
    }

    await ctx.db.insert("dashUsers", {
      username: "gilow",
      passwordHash: simpleHash("we_love_murphy"),
      displayName: "Admin User",
      role: "admin",
      createdAt: Date.now(),
    });

    return "Demo user created!";
  },
});

/**
 * Update the admin user credentials (run once to migrate from old credentials)
 */
export const updateAdminCredentials = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Delete old admin user if exists
    const oldUser = await ctx.db
      .query("dashUsers")
      .withIndex("by_username", (q) => q.eq("username", "admin"))
      .unique();

    if (oldUser) {
      await ctx.db.delete(oldUser._id);
    }

    // Check if new user already exists
    const existingUser = await ctx.db
      .query("dashUsers")
      .withIndex("by_username", (q) => q.eq("username", "gilow"))
      .unique();

    if (existingUser) {
      // Update the password
      await ctx.db.patch(existingUser._id, {
        passwordHash: simpleHash("we_love_murphy"),
      });
      return "Updated existing gilow user password.";
    }

    // Create new user
    await ctx.db.insert("dashUsers", {
      username: "gilow",
      passwordHash: simpleHash("we_love_murphy"),
      displayName: "Admin User",
      role: "admin",
      createdAt: Date.now(),
    });

    return "Created new gilow user and removed old admin user.";
  },
});
