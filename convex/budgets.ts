import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// READ: Fetch all category budget caps for authenticated user
export const getBudgets = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("budgets")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

// CREATE / UPDATE: Set category budget limit cap
export const setBudgetCap = mutation({
  args: {
    category: v.string(),
    monthlyCap: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const categoryTrimmed = args.category.trim();

    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("category"), categoryTrimmed))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        monthlyCap: args.monthlyCap,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("budgets", {
        userId: identity.subject,
        category: categoryTrimmed,
        monthlyCap: args.monthlyCap,
        updatedAt: Date.now(),
      });
    }
  },
});

// DELETE: Remove budget cap for category
export const removeBudgetCap = mutation({
  args: {
    id: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await ctx.db.delete(args.id);
  },
});
