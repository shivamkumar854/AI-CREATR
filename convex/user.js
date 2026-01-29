import { mutation } from "./_generated/server";

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        lastActiveAt: now,
      });
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? undefined,
      tokenIdentifier: identity.tokenIdentifier,

      imageUrl: identity.pictureUrl ?? undefined,
      username: undefined,

      createdAt: now,
      lastActiveAt: now,
    });

    return userId;
  },
});
