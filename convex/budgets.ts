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
    categoryId: v.optional(v.id("categories")),
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
        categoryId: args.categoryId ?? existing.categoryId,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("budgets", {
        userId: identity.subject,
        category: categoryTrimmed,
        categoryId: args.categoryId,
        monthlyCap: args.monthlyCap,
        rolloverAmount: 0,
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

// TRANSFER: Move saved / remaining balance from one budget to another
export const transferBudgetBalance = mutation({
  args: {
    fromCategory: v.string(),
    toCategory: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    if (args.amount <= 0) {
      throw new Error("Transfer amount must be greater than zero.");
    }
    if (args.fromCategory.trim().toLowerCase() === args.toCategory.trim().toLowerCase()) {
      throw new Error("Source and target budget categories cannot be the same.");
    }

    const fromTrimmed = args.fromCategory.trim();
    const toTrimmed = args.toCategory.trim();

    // 1. Source budget
    const sourceBudget = await ctx.db
      .query("budgets")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("category"), fromTrimmed))
      .first();

    if (!sourceBudget) {
      throw new Error(`Budget cap for "${fromTrimmed}" was not found.`);
    }

    const sourceRollover = sourceBudget.rolloverAmount || 0;
    await ctx.db.patch(sourceBudget._id, {
      rolloverAmount: sourceRollover - args.amount,
      updatedAt: Date.now(),
    });

    // 2. Target budget (find or create)
    const targetBudget = await ctx.db
      .query("budgets")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("category"), toTrimmed))
      .first();

    if (targetBudget) {
      const targetRollover = targetBudget.rolloverAmount || 0;
      await ctx.db.patch(targetBudget._id, {
        rolloverAmount: targetRollover + args.amount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("budgets", {
        userId: identity.subject,
        category: toTrimmed,
        monthlyCap: 0,
        rolloverAmount: args.amount,
        updatedAt: Date.now(),
      });
    }

    // 3. Log Transfer
    await ctx.db.insert("budgetTransfers", {
      userId: identity.subject,
      fromCategory: fromTrimmed,
      toCategory: toTrimmed,
      amount: args.amount,
      transferredAt: Date.now(),
      note: args.note,
    });

    return true;
  },
});

// READ: Fetch transfer history
export const getBudgetTransfers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("budgetTransfers")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

