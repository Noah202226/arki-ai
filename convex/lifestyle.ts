import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- READ: Get User's Lifestyle Settings ---
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("lifestyleSettings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

// --- SAVE: Save or Update Lifestyle Settings ---
export const saveSettings = mutation({
  args: {
    housingMonthly: v.number(),
    utilitiesMonthly: v.number(),
    foodMonthly: v.number(),
    transportMonthly: v.number(),
    savingsBufferPercent: v.number(),
    useLivePayroll: v.optional(v.boolean()),
    customIncome: v.optional(v.number()),
    useLiveSubscriptions: v.optional(v.boolean()),
    customSubscriptionsCost: v.optional(v.number()),
    useLiveDebt: v.optional(v.boolean()),
    customDebtCost: v.optional(v.number()),
    leisureItems: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          amount: v.number(),
          frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("lifestyleSettings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("lifestyleSettings", {
        userId: identity.subject,
        ...args,
      });
    }
  },
});

// --- READ: Get User's Financial Goals ---
export const getGoals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("financialGoals")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

// --- CREATE: Add a Financial Goal ---
export const createGoal = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    months: v.number(),
    linkedAccountId: v.optional(v.string()),
    customSaved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("financialGoals", {
      userId: identity.subject,
      name: args.name,
      targetAmount: args.targetAmount,
      months: args.months,
      linkedAccountId: args.linkedAccountId,
      customSaved: args.customSaved || 0,
      isCompleted: false,
    });
  },
});

// --- UPDATE: Update Goal Details or Linked Wallet ---
export const updateGoal = mutation({
  args: {
    id: v.id("financialGoals"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    months: v.optional(v.number()),
    linkedAccountId: v.optional(v.string()),
    customSaved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Goal not found or unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// --- DELETE: Delete a Goal ---
export const deleteGoal = mutation({
  args: { id: v.id("financialGoals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Goal not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
