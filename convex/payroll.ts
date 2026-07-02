import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's payroll settings
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("payrollSettings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

// Update or initialize payroll settings including SSS, PhilHealth, Pag-IBIG, Tax, and Late rates
export const saveSettings = mutation({
  args: {
    baseDailyRate: v.number(),
    otHourlyRate: v.number(),
    currentCutOff: v.string(),
    sssDeduction: v.optional(v.number()),
    philhealthDeduction: v.optional(v.number()),
    pagibigDeduction: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    lateRatePerMin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("payrollSettings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("payrollSettings", {
        userId: identity.subject,
        ...args,
      });
    }
  },
});

// Helper to compute stats for a list of work logs
function computeStats(logs: any[], settings: any) {
  let daysWorked = 0;
  let expectedBase = 0;
  let expectedOT = 0;
  let totalLatesMinutes = 0;
  let expectedLateDeductions = 0;

  // Filter logs where base is not claimed
  const unclaimedBaseLogs = logs.filter(l => !l.claimed);
  // Filter logs where OT is not claimed
  const unclaimedOtLogs = logs.filter(l => !l.otClaimed);

  // Expected base and lates come from unclaimedBaseLogs
  unclaimedBaseLogs.forEach((log) => {
    if (log.isWorked) {
      daysWorked += 1;
      expectedBase += log.baseDailyRate;
      const lates = log.lateMinutes || 0;
      totalLatesMinutes += lates;
      if (settings?.lateRatePerMin) {
        expectedLateDeductions += lates * settings.lateRatePerMin;
      }
    }
  });

  // Expected OT comes from unclaimedOtLogs
  unclaimedOtLogs.forEach((log) => {
    if (log.isWorked) {
      expectedOT += log.otHours * log.otHourlyRate;
    }
  });

  const sss = settings?.sssDeduction || 0;
  const philhealth = settings?.philhealthDeduction || 0;
  const pagibig = settings?.pagibigDeduction || 0;
  
  // Tax applies to the gross base pay since OT is claimed separately
  const tax = settings?.taxRate ? (expectedBase * (settings.taxRate / 100)) : 0;
  const totalDeductions = sss + philhealth + pagibig + expectedLateDeductions + tax;
  const netBasePay = Math.max(0, expectedBase - totalDeductions);

  return {
    daysWorked,
    expectedBase,
    expectedOT,
    totalLatesMinutes,
    expectedLateDeductions,
    sssDeduction: sss,
    philhealthDeduction: philhealth,
    pagibigDeduction: pagibig,
    taxDeduction: tax,
    totalDeductions,
    totalExpected: expectedBase, // gross base
    netPay: netBasePay, // net base pay without OT
  };
}

// Get logs and compute dynamic stats (supporting current vs next cutoff projections)
export const getCutOffStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db
      .query("payrollSettings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const activeCutOff = settings?.currentCutOff || "Not Configured";

    // 1. Fetch all user logs
    const allLogs = await ctx.db
      .query("workLogs")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    // Active/Current cutoff logs (only unclaimed base OR unclaimed OT logs)
    const currentLogs = allLogs.filter(
      (log) => log.cutOffPeriod === activeCutOff && (!log.claimed || !log.otClaimed)
    );

    // Next/Future cutoff logs
    const nextLogs = allLogs.filter(
      (log) => log.cutOffPeriod !== activeCutOff && (!log.claimed || !log.otClaimed)
    );

    // Compute stats
    const currentStats = computeStats(currentLogs, settings);
    const nextStats = computeStats(nextLogs, settings);

    return {
      logs: currentLogs,
      allLogs,
      settings,
      stats: currentStats,
      nextStats,
      activeCutOff,
    };
  },
});

// Log a work day with default claimed states as false
export const addWorkDay = mutation({
  args: {
    date: v.string(),
    cutOffPeriod: v.string(),
    baseDailyRate: v.number(),
    isWorked: v.boolean(),
    otHours: v.number(),
    otHourlyRate: v.number(),
    lateMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await ctx.db.insert("workLogs", {
      userId: identity.subject,
      ...args,
      claimed: false,
      otClaimed: false,
    });
  },
});

// Update a work day log entry
export const updateWorkDay = mutation({
  args: {
    id: v.id("workLogs"),
    date: v.string(),
    isWorked: v.boolean(),
    otHours: v.number(),
    baseDailyRate: v.number(),
    otHourlyRate: v.number(),
    lateMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

// Delete a work day log
export const deleteWorkDay = mutation({
  args: {
    id: v.id("workLogs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Claim expected base income or OT separately and deposit it directly to a wallet
export const claimPayroll = mutation({
  args: {
    cutOffPeriod: v.string(),
    accountId: v.id("accounts"),
    amount: v.number(),
    claimType: v.union(v.literal("base"), v.literal("ot")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 1. Find all active logs for this cutoff
    const logs = await ctx.db
      .query("workLogs")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("cutOffPeriod"), args.cutOffPeriod))
      .collect();

    const now = Date.now();

    if (args.claimType === "base") {
      const unclaimedBase = logs.filter((l) => !l.claimed);
      if (unclaimedBase.length === 0) {
        throw new Error("No unclaimed base pay work logs found.");
      }
      for (const log of unclaimedBase) {
        await ctx.db.patch(log._id, {
          claimed: true,
          claimedAt: now,
        });
      }
    } else {
      const unclaimedOt = logs.filter((l) => !l.otClaimed);
      if (unclaimedOt.length === 0) {
        throw new Error("No unclaimed overtime work logs found.");
      }
      for (const log of unclaimedOt) {
        await ctx.db.patch(log._id, {
          otClaimed: true,
          otClaimedAt: now,
        });
      }
    }

    // 2. Deposit money into target account
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== identity.subject) {
      throw new Error("Target account not found");
    }
    await ctx.db.patch(args.accountId, {
      balance: account.balance + args.amount,
    });

    // 3. Create category link for Payroll/Salary if it exists
    const categoryMatch = await ctx.db
      .query("categories")
      .withIndex("by_userId_and_type", (q) => q.eq("userId", identity.subject).eq("type", "income"))
      .filter((q) => q.eq(q.field("name"), "Salary"))
      .first();

    // 4. Create transaction entry
    const titleText =
      args.claimType === "base"
        ? `Claimed Base Pay Cutoff: ${args.cutOffPeriod}`
        : `Claimed Overtime Cutoff: ${args.cutOffPeriod}`;

    await ctx.db.insert("financials", {
      userId: identity.subject,
      title: titleText,
      amount: args.amount,
      type: "income",
      category: "Salary",
      categoryId: categoryMatch?._id,
      accountId: args.accountId,
      status: "completed",
      frequency: "one-off",
      dueDate: now,
    });

    return { success: true };
  },
});
