import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// CREATE
export const createAccount = mutation({
  args: {
    accountName: v.string(),
    initialBalance: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("accounts", {
      userId: identity.subject,
      accountName: args.accountName,
      balance: args.initialBalance,
      currency: args.currency,
    });
  },
});

// READ
export const getAccounts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

// UPDATE BALANCE (Gagamitin ito ng financials mutation mamaya)
export const updateBalance = mutation({
  args: { accountId: v.id("accounts"), newBalance: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, { balance: args.newBalance });
  },
});

// DELETE
export const removeAccount = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Add New Balance
export const addFunds = mutation({
  args: {
    accountId: v.id("accounts"),
    amount: v.number(),
    source: v.string(), // e.g., "Salary", "Freelance"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    // 1. Update the Account Balance
    const newBalance = account.balance + args.amount;
    await ctx.db.patch(args.accountId, {
      balance: newBalance,
    });

    // 2. Insert into 'financials' table (para sa general history)
    // In-align natin ito sa fields ng 'financials' table sa schema mo
    await ctx.db.insert("financials", {
      userId: identity.subject,
      accountId: args.accountId,
      title: `Deposit: ${args.source}`,
      amount: args.amount,
      type: "income",
      category: "Deposit",
      status: "completed",
      frequency: "one-time",
      dueDate: Date.now(),
      isDeleted: false, // Default value para sa soft delete
      deletedAt: undefined, // Default value para sa soft delete
    });

    // 3. Insert into 'income' table (para sa Income Monitoring specifically)
    // In-align natin ito sa fields ng 'income' table sa schema mo
    await ctx.db.insert("income", {
      userId: identity.subject,
      accountId: args.accountId,
      source: args.source,
      amount: args.amount,
      category: "Active", // O pwede mong gawing dynamic depende sa input
      dateReceived: Date.now(),
    });

    return newBalance;
  },
});
