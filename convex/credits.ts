import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addCredit = mutation({
  args: {
    creditorName: v.string(),
    totalAmount: v.number(),
    interest: v.number(),
    monthlyInstallment: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("credits", {
      ...args,
      userId: identity.subject,
      startDate: Date.now(),
      status: "ongoing",
    });
  },
});

export const getCreditSummary = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // 1. Kunin lahat ng credits (Patrick, Gloan, etc.)
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    // 2. Kunin lahat ng "Debt Payment" transactions
    const allPayments = await ctx.db
      .query("financials")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", identity.subject))
      .collect();

    // 3. I-map ang payments sa kaukulang credit base sa title
    return credits.map((credit) => {
      const payments = allPayments.filter(
        (tx) => tx.creditId === credit._id && tx.type === "expense",
      );

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = credit.totalAmount - totalPaid;

      // Excel-style calculation for remaining months
      const remainingMonths =
        credit.monthlyInstallment > 0
          ? Math.ceil(remainingBalance / credit.monthlyInstallment)
          : 0;

      return {
        ...credit,
        totalPaid,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        remainingMonths: remainingMonths > 0 ? remainingMonths : 0,
        progress: (totalPaid / credit.totalAmount) * 100,
      };
    });
  },
});

// --- UPDATE: Edit existing credit details ---
export const updateCredit = mutation({
  args: {
    id: v.id("credits"),
    creditorName: v.string(),
    totalAmount: v.number(),
    interest: v.number(),
    monthlyInstallment: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// --- DELETE: Remove a credit record ---
export const deleteCredit = mutation({
  args: { id: v.id("credits") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
