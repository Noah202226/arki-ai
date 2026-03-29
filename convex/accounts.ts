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

    // 1. Create the Account and get its new ID
    const accountId = await ctx.db.insert("accounts", {
      userId: identity.subject,
      accountName: args.accountName,
      balance: args.initialBalance,
      currency: args.currency,
    });

    // 2. Log the Initial Balance in the Financials History
    // This makes sure your "Transaction History" isn't empty on day one
    await ctx.db.insert("financials", {
      userId: identity.subject,
      accountId: accountId, // Linked to the account we just made
      title: `Initial Balance: ${args.accountName}`,
      amount: args.initialBalance,
      type: "income",
      category: "Starting Balance",
      status: "completed",
      frequency: "one-time",
      dueDate: Date.now(),
      isDeleted: false,
    });

    return accountId;
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
      category: `Deposit - Initial Amount of ₱${args.amount.toLocaleString()}`,
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

// Transfer Funds Between Accounts
export const transferFunds = mutation({
  args: {
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
    amount: v.number(),
    fee: v.optional(v.number()), // Optional transfer fee
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    if (args.fromAccountId === args.toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }

    const fromAccount = await ctx.db.get(args.fromAccountId);
    const toAccount = await ctx.db.get(args.toAccountId);

    if (!fromAccount || !toAccount) throw new Error("Account not found");

    const feeAmount = args.fee || 0;
    const totalDeduction = args.amount + feeAmount;

    if (fromAccount.balance < totalDeduction) {
      throw new Error("Insufficient balance in source account");
    }

    // 1. DEDUCT from Source Account
    await ctx.db.patch(args.fromAccountId, {
      balance: fromAccount.balance - totalDeduction,
    });

    // 2. ADD to Destination Account
    await ctx.db.patch(args.toAccountId, {
      balance: toAccount.balance + args.amount,
    });

    // We use a single timestamp so all these records "group" perfectly in your history
    const timestamp = Date.now();

    // 3. LOG OUTGOING: The main transfer amount
    await ctx.db.insert("financials", {
      userId: identity.subject,
      accountId: args.fromAccountId,
      title: `Transfer to ${toAccount.accountName}`,
      amount: args.amount,
      type: "expense",
      category: "Transfer",
      status: "completed",
      frequency: "one-time",
      dueDate: timestamp,
      isDeleted: false,
    });

    // 4. LOG OUTGOING: The transfer fee (Only if greater than 0)
    if (feeAmount > 0) {
      await ctx.db.insert("financials", {
        userId: identity.subject,
        accountId: args.fromAccountId,
        title: `Transfer Fee (to ${toAccount.accountName})`,
        amount: feeAmount,
        type: "expense",
        category: "Bank Fee",
        status: "completed",
        frequency: "one-time",
        dueDate: timestamp,
        isDeleted: false,
      });
    }

    // 5. LOG INCOMING: The amount received by the destination account
    await ctx.db.insert("financials", {
      userId: identity.subject,
      accountId: args.toAccountId,
      title: `Transfer from ${fromAccount.accountName}`,
      amount: args.amount,
      type: "income",
      category: "Transfer",
      status: "completed",
      frequency: "one-time",
      dueDate: timestamp,
      isDeleted: false,
    });

    return true;
  },
});
