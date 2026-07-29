import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to calculate the next billing date
function calculateNextBillingDate(current: number, frequency: "weekly" | "monthly" | "yearly"): number {
  const date = new Date(current);
  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.getTime();
}

// --- CREATE: Add a New Subscription or Client Retainer ---
export const createSubscription = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    frequency: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("weekly")),
    nextBillingDate: v.number(),
    accountId: v.id("accounts"),
    categoryId: v.id("categories"),
    type: v.optional(v.union(v.literal("expense"), v.literal("income"))),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Verify account and category exist
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    return await ctx.db.insert("subscriptions", {
      userId: identity.subject,
      name: args.name,
      amount: args.amount,
      frequency: args.frequency,
      nextBillingDate: args.nextBillingDate,
      accountId: args.accountId,
      categoryId: args.categoryId,
      status: "active",
      type: args.type || "expense",
      description: args.description,
      isDeleted: false,
    });
  },
});

// --- READ: Get Subscriptions and Summary Statistics ---
export const getSubscriptionSummary = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Fetch all active subscriptions
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.not(q.eq(q.field("isDeleted"), true)))
      .collect();

    // Fetch accounts and categories to resolve names
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_userId_and_type", (q) =>
        q.eq("userId", identity.subject).eq("type", "expense")
      )
      .collect();

    // Also pull income-type categories in case any subscription was linked to one
    const incomeCategories = await ctx.db
      .query("categories")
      .withIndex("by_userId_and_type", (q) =>
        q.eq("userId", identity.subject).eq("type", "income")
      )
      .collect();

    const allCategories = [...categories, ...incomeCategories];

    const accountMap = new Map(accounts.map((a) => [a._id.toString(), a]));
    const categoryMap = new Map(allCategories.map((c) => [c._id.toString(), c]));

    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    let totalMonthlyCost = 0;
    let totalYearlyCost = 0;
    let totalMonthlyIncome = 0;
    let totalYearlyIncome = 0;

    const items = subscriptions.map((sub) => {
      const account = accountMap.get(sub.accountId.toString());
      const category = categoryMap.get(sub.categoryId.toString());
      const subType = sub.type || "expense";

      // Normalize amounts to compute total recurring rates
      let monthlyContribution = 0;
      let yearlyContribution = 0;

      if (sub.status === "active") {
        if (sub.frequency === "weekly") {
          monthlyContribution = sub.amount * (52 / 12);
          yearlyContribution = sub.amount * 52;
        } else if (sub.frequency === "monthly") {
          monthlyContribution = sub.amount;
          yearlyContribution = sub.amount * 12;
        } else if (sub.frequency === "yearly") {
          monthlyContribution = sub.amount / 12;
          yearlyContribution = sub.amount;
        }
      }

      if (subType === "income") {
        totalMonthlyIncome += monthlyContribution;
        totalYearlyIncome += yearlyContribution;
      } else {
        totalMonthlyCost += monthlyContribution;
        totalYearlyCost += yearlyContribution;
      }

      const isDueSoon = sub.status === "active" && sub.nextBillingDate <= sevenDaysFromNow && sub.nextBillingDate >= now;
      const isOverdue = sub.status === "active" && sub.nextBillingDate < now;

      return {
        ...sub,
        type: subType,
        accountName: account?.accountName || "Unknown Account",
        categoryName: category?.name || "Unknown Category",
        categoryColor: category?.color || "#94a3b8",
        categoryIcon: category?.icon,
        isDueSoon,
        isOverdue,
      };
    });

    // Sort: Overdue first, then due soon, then by next billing date
    items.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "active" ? -1 : 1;
      }
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }
      if (a.isDueSoon !== b.isDueSoon) {
        return a.isDueSoon ? -1 : 1;
      }
      return a.nextBillingDate - b.nextBillingDate;
    });

    return {
      items,
      totalMonthlyCost,
      totalYearlyCost,
      totalMonthlyIncome,
      totalYearlyIncome,
    };
  },
});

// --- UPDATE: Edit Subscription Details ---
export const updateSubscription = mutation({
  args: {
    id: v.id("subscriptions"),
    name: v.string(),
    amount: v.number(),
    frequency: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("weekly")),
    nextBillingDate: v.number(),
    accountId: v.id("accounts"),
    categoryId: v.id("categories"),
    status: v.string(), // "active", "paused", "cancelled"
    type: v.optional(v.union(v.literal("expense"), v.literal("income"))),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Subscription not found or unauthorized");
    }

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// --- DELETE: Soft Delete Subscription ---
export const deleteSubscription = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Subscription not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      isDeleted: true,
    });
  },
});

// --- UPDATE: Mark Subscription as Paid/Collected ---
export const paySubscription = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sub = await ctx.db.get(args.id);
    if (!sub || sub.userId !== identity.subject) {
      throw new Error("Subscription not found or unauthorized");
    }

    if (sub.status !== "active") {
      throw new Error("Cannot process a non-active subscription/retainer");
    }

    // 1. Get account and category info for transaction log
    const account = await ctx.db.get(sub.accountId);
    if (!account) throw new Error("Account not found");

    const category = await ctx.db.get(sub.categoryId);
    const categoryName = category?.name || "Subscription";
    const subType = sub.type || "expense";

    // 2. Insert into financials (Expense or Income record)
    await ctx.db.insert("financials", {
      userId: identity.subject,
      title: subType === "income" ? `Client Retainer: ${sub.name}` : `Subscription: ${sub.name}`,
      amount: sub.amount,
      type: subType,
      category: categoryName,
      categoryId: sub.categoryId,
      accountId: sub.accountId,
      status: "completed",
      frequency: "one-time",
      dueDate: Date.now(),
      isDeleted: false,
    });

    // 3. Update account balance (Deposit for income, deduct for expense)
    const newBalance = subType === "income" ? account.balance + sub.amount : account.balance - sub.amount;
    await ctx.db.patch(sub.accountId, {
      balance: newBalance,
    });

    // 4. Calculate next billing date
    const baseDate = Math.max(sub.nextBillingDate, Date.now());
    const nextBillingDate = calculateNextBillingDate(baseDate, sub.frequency);

    // 5. Update subscription with next billing date
    await ctx.db.patch(args.id, {
      nextBillingDate,
    });

    return nextBillingDate;
  },
});
