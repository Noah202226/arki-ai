import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Fetch all quick-chip presets for the current user */
export const getQuickChips = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("quickChips")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

/** Create a new quick-chip preset */
export const createQuickChip = mutation({
  args: {
    label: v.string(),
    emoji: v.string(),
    type: v.string(),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("quickChips", {
      userId: identity.subject,
      label: args.label,
      emoji: args.emoji,
      type: args.type,
      categoryId: args.categoryId,
    });
  },
});

/** Delete a quick-chip preset */
export const deleteQuickChip = mutation({
  args: { id: v.id("quickChips") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
