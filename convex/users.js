import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Store or update current user
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called store without authentication");
    }

    const now = Date.now();

    // Check existing user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user) {
      // Update name if changed
      if (identity.name && user.name !== identity.name) {
        await ctx.db.patch(user._id, {
          name: identity.name,
          lastActiveAt: now,
        });
      } else {
        await ctx.db.patch(user._id, {
          lastActiveAt: now,
        });
      }
      return user._id;
    }

    // Create new user (NULL-SAFE)
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,

      // ✅ MUST be undefined if missing
      email: identity.email ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,

      username: undefined,

      createdAt: now,
      lastActiveAt: now,
    });
  },
});

/**
 * Get current logged-in user
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // better UX than throwing
    }

    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
  },
});

/**
 * Update username
 */
export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(args.username)) {
      throw new Error(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
    }

    if (args.username.length < 3 || args.username.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }

    // Check availability
    if (args.username !== user.username) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) =>
          q.eq("username", args.username)
        )
        .unique();

      if (existingUser) {
        throw new Error("Username is already taken");
      }
    }

    await ctx.db.patch(user._id, {
      username: args.username,
      lastActiveAt: Date.now(),
    });

    return user._id;
  },
});

/**
 * Public user profile by username
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.eq("username", args.username)
      )
      .unique();

    if (!user) return null;

    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
    };
  },
});
