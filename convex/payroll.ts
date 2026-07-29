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
    currentCutOff: v.optional(v.string()),
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

interface WorkLogItem {
  isWorked: boolean;
  baseDailyRate: number;
  otHours: number;
  otHourlyRate: number;
  lateMinutes?: number;
  claimed?: boolean;
  otClaimed?: boolean;
}

interface PayrollSettingsItem {
  lateRatePerMin?: number;
  sssDeduction?: number;
  philhealthDeduction?: number;
  pagibigDeduction?: number;
  taxRate?: number;
}

// Helper to compute stats for a list of work logs
function computeStats(logs: WorkLogItem[], settings: PayrollSettingsItem | null) {
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
      // Late deduction: baseDailyRate / 8 hrs / 60 mins
      const lateRatePerMin = log.baseDailyRate ? (log.baseDailyRate / (8 * 60)) : (settings?.lateRatePerMin || 0);
      expectedLateDeductions += lates * lateRatePerMin;
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

// Get logs and compute dynamic stats
export const getCutOffStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db
      .query("payrollSettings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const activeCutOff = settings?.currentCutOff || "Unclaimed";

    // Fetch all user logs
    const allLogs = await ctx.db
      .query("workLogs")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    // Unclaimed shift logs (base unclaimed OR OT unclaimed)
    const unclaimedLogs = allLogs.filter(
      (log) => !log.claimed || !log.otClaimed
    );

    // Compute stats on unclaimed shifts
    const currentLogs =
      activeCutOff !== "Unclaimed"
        ? unclaimedLogs.filter((log) => !log.cutOffPeriod || log.cutOffPeriod === activeCutOff)
        : unclaimedLogs;

    const nextLogs =
      activeCutOff !== "Unclaimed"
        ? unclaimedLogs.filter((log) => log.cutOffPeriod && log.cutOffPeriod !== activeCutOff)
        : [];

    const stats = computeStats(currentLogs, settings);
    const nextStats = computeStats(nextLogs, settings);

    return {
      logs: unclaimedLogs,
      allLogs,
      settings,
      stats,
      nextStats,
      activeCutOff,
    };
  },
});

// Log a work day with default claimed states as false
export const addWorkDay = mutation({
  args: {
    date: v.string(),
    cutOffPeriod: v.optional(v.string()),
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
      cutOffPeriod: args.cutOffPeriod || "",
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

// Claim expected base income, OT, or both within a date range and deposit directly to a wallet
export const claimPayroll = mutation({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    accountId: v.id("accounts"),
    amount: v.number(),
    claimType: v.union(v.literal("base"), v.literal("ot"), v.literal("both")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Fetch all logs for the user within the date range
    const logs = await ctx.db
      .query("workLogs")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const rangeLogs = logs.filter(
      (log) => log.date >= args.startDate && log.date <= args.endDate
    );

    const now = Date.now();
    let updatedCount = 0;

    for (const log of rangeLogs) {
      const updates: { claimed?: boolean; claimedAt?: number; otClaimed?: boolean; otClaimedAt?: number } = {};

      if ((args.claimType === "base" || args.claimType === "both") && !log.claimed) {
        updates.claimed = true;
        updates.claimedAt = now;
      }

      if ((args.claimType === "ot" || args.claimType === "both") && !log.otClaimed) {
        updates.otClaimed = true;
        updates.otClaimedAt = now;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(log._id, updates);
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      throw new Error("No unclaimed shift entries found in the selected date range.");
    }

    // Deposit money into target account
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== identity.subject) {
      throw new Error("Target account not found");
    }
    await ctx.db.patch(args.accountId, {
      balance: account.balance + args.amount,
    });

    // Create category link for Payroll/Salary if it exists
    const categoryMatch = await ctx.db
      .query("categories")
      .withIndex("by_userId_and_type", (q) => q.eq("userId", identity.subject).eq("type", "income"))
      .filter((q) => q.eq(q.field("name"), "Salary"))
      .first();

    const claimLabel =
      args.claimType === "base"
        ? "Base Pay"
        : args.claimType === "ot"
        ? "Overtime Pay"
        : "Base + OT Pay";

    const titleText = `Claimed Payroll (${claimLabel}): ${args.startDate} to ${args.endDate}`;

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
