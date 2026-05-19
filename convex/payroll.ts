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

// Update or initialize payroll settings
export const saveSettings = mutation({
  args: {
    baseDailyRate: v.number(),
    otHourlyRate: v.number(),
    currentCutOff: v.string(),
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

// Get logs and compute dynamic stats based on saved settings
export const getCutOffStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Fetch user settings first
    const settings = await ctx.db
      .query("payrollSettings")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const activeCutOff = settings?.currentCutOff || "Not Configured";

    const logs = await ctx.db
      .query("workLogs")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("cutOffPeriod"), activeCutOff))
      .collect();

    let daysWorked = 0;
    let expectedBase = 0;
    let expectedOT = 0;

    logs.forEach((log) => {
      if (log.isWorked) {
        daysWorked += 1;
        expectedBase += log.baseDailyRate;
        expectedOT += log.otHours * log.otHourlyRate;
      }
    });

    return {
      logs,
      settings,
      stats: {
        daysWorked,
        expectedBase,
        expectedOT,
        totalExpected: expectedBase + expectedOT,
      },
    };
  },
});

// Log a work day
export const addWorkDay = mutation({
  args: {
    date: v.string(),
    cutOffPeriod: v.string(),
    baseDailyRate: v.number(),
    isWorked: v.boolean(),
    otHours: v.number(),
    otHourlyRate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await ctx.db.insert("workLogs", {
      userId: identity.subject,
      ...args,
    });
  },
});
