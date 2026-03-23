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
