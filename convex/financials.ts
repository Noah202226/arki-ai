import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- READ: Get Financial Summary (This Week, Next Month, Total) ---
export const getFinancialSummary = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const endOfWeek = startOfToday + 7 * 24 * 60 * 60 * 1000;
    const endOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 2,
      0,
    ).getTime();

    const allPayables = await ctx.db
      .query("financials")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", identity.subject))
      .collect();

    const dueThisWeek = allPayables.filter(
      (p) =>
        p.dueDate >= startOfToday &&
        p.dueDate <= endOfWeek &&
        p.status === "pending",
    );

    const dueNextMonth = allPayables.filter(
      (p) =>
        p.dueDate > endOfWeek &&
        p.dueDate <= endOfNextMonth &&
        p.status === "pending",
    );

    const totalThisWeek = dueThisWeek.reduce((sum, p) => sum + p.amount, 0);
    const totalNextMonth = dueNextMonth.reduce((sum, p) => sum + p.amount, 0);

    return {
      thisWeek: { items: dueThisWeek, total: totalThisWeek },
      nextMonth: { items: dueNextMonth, total: totalNextMonth },
      grandTotal: totalThisWeek + totalNextMonth,
    };
  },
});

// --- CREATE: Add a New Transaction (Income or Expense) ---
export const addTransaction = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    type: v.string(),
    category: v.string(),
    accountId: v.id("accounts"),
    date: v.number(), // Ito ay gagamitin natin bilang dueDate
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 1. Insert Transaction (Siguraduhing match sa schema fields lang)
    const id = await ctx.db.insert("financials", {
      userId: identity.subject,
      title: args.title,
      amount: args.amount,
      type: args.type,
      category: args.category,
      accountId: args.accountId,
      status: "completed",
      frequency: "one-time",
      dueDate: args.date, // Ginamit natin yung date mula sa form
    });

    // 2. Update Account Balance
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    const newBalance =
      args.type === "income"
        ? account.balance + args.amount
        : account.balance - args.amount;

    await ctx.db.patch(args.accountId, { balance: newBalance });

    return id;
  },
});

// --- READ: Get All Transactions (History) ---
export const getTransactions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("financials")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// --- UPDATE: Mark Payable as Paid ---
export const markAsPaid = mutation({
  args: { id: v.id("financials"), accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.id);
    const account = await ctx.db.get(args.accountId);

    if (!transaction || !account) throw new Error("Record not found");

    // Bawasan ang balance ng account
    await ctx.db.patch(args.accountId, {
      balance: account.balance - transaction.amount,
    });

    // I-update ang status ng payable
    await ctx.db.patch(args.id, { status: "paid" });
  },
});

// --- DELETE: Remove Transaction ---
export const remove = mutation({
  args: { id: v.id("financials") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
