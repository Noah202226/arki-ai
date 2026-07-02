import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    // THE FIX: Add the userId field
    userId: v.string(),

    text: v.string(),
    description: v.optional(v.string()),
    isCompleted: v.boolean(),
    isDeleted: v.boolean(),

    // Support for the Task/Routine system
    type: v.union(v.literal("task"), v.literal("routine")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),

    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
    lastCompleted: v.optional(v.number()),
    category: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // 1. FINANCIALS TABLE (Payables & Subscriptions)
  financials: defineTable({
    userId: v.string(),
    title: v.string(),
    amount: v.number(),
    type: v.string(), // "income" or "expense"
    category: v.string(), // Idagdag ito
    categoryId: v.optional(v.id("categories")),
    accountId: v.id("accounts"), // Idagdag ito para ma-link sa Wallet
    creditId: v.optional(v.id("credits")),
    status: v.string(), // "completed", "pending", "paid"
    frequency: v.string(),
    dueDate: v.number(),
    isDeleted: v.optional(v.boolean()), // Para sa soft delete
    deletedAt: v.optional(v.number()),
  })
    .index("by_userId_and_date", ["userId", "dueDate"])
    .index("by_account", ["accountId"]),

  // NEW: CATEGORIES TABLE (For KPI Dashboard & UI)
  categories: defineTable({
    userId: v.string(),
    name: v.string(), // e.g., "Food & Dining", "Utilities", "Salary"
    type: v.string(), // "income" or "expense"
    color: v.optional(v.string()), // e.g., "#EF4444" - Super useful for dashboard charts!
    icon: v.optional(v.string()), // e.g., "Coffee", "Zap" (Lucide icon names)
  }).index("by_userId_and_type", ["userId", "type"]),

  // 2. ACCOUNTS TABLE (Balances: GCash, Bank, etc.)
  accounts: defineTable({
    userId: v.string(),
    accountName: v.string(),
    balance: v.number(),
    currency: v.string(),
    isSavings: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  // 3. NEW: INCOME TABLE (Dito natin ilalagay ang Income Monitoring)
  income: defineTable({
    userId: v.string(),
    source: v.string(), // e.g., "Salary", "Freelance", "GCash Cash-in"
    amount: v.number(),
    dateReceived: v.number(), // Unix timestamp
    accountId: v.id("accounts"), // I-li-link natin kung saang account pumasok ang pera
    category: v.string(), // e.g., "Active", "Passive", "Gift"
    categoryId: v.optional(v.id("categories")),
  }).index("by_userId_and_date", ["userId", "dateReceived"]),

  // Credit Schema
  credits: defineTable({
    userId: v.string(),
    creditorName: v.string(),
    totalAmount: v.number(),
    interest: v.number(),
    monthlyInstallment: v.number(),
    startDate: v.number(),
    dueDate: v.number(), // Dito natin ilalagay ang araw (e.g., 15 kung tuwing ika-15 ang bayad)
    category: v.optional(v.string()), // e.g., "Credit Card", "Personal Loan", "Saan-saan"
    categoryId: v.optional(v.id("categories")),
    status: v.string(),
    totalPaid: v.number(),
    archivedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // NEW: Payroll Tracking Table
  workLogs: defineTable({
    userId: v.string(),
    date: v.string(), // Format: YYYY-MM-DD
    cutOffPeriod: v.string(), // e.g., "May 15 - May 30"

    // Computation fields
    baseDailyRate: v.number(),
    isWorked: v.boolean(), // Did you go to work?
    otHours: v.number(), // Number of OT hours
    otHourlyRate: v.number(), // Your OT rate per hour
    lateMinutes: v.optional(v.number()), // Late minutes recorded
    claimed: v.optional(v.boolean()), // Has this cutoff been claimed already?
    claimedAt: v.optional(v.number()), // Unix timestamp of claim
  }).index("by_userId", ["userId"]),

  payrollSettings: defineTable({
    userId: v.string(),
    baseDailyRate: v.number(),
    otHourlyRate: v.number(),
    currentCutOff: v.string(), // e.g., "May 15 - May 30"
    // Deductions
    sssDeduction: v.optional(v.number()),
    philhealthDeduction: v.optional(v.number()),
    pagibigDeduction: v.optional(v.number()),
    taxRate: v.optional(v.number()), // Percentage (e.g. 5 for 5%)
    lateRatePerMin: v.optional(v.number()), // Deduction amount per minute late
  }).index("by_userId", ["userId"]),

  // Quick-add chip presets (user-customizable)
  quickChips: defineTable({
    userId: v.string(),
    label: v.string(),       // e.g. "Lunch", "Salary"
    emoji: v.string(),       // e.g. "🍱"
    type: v.string(),        // "expense" | "income"
    categoryId: v.id("categories"),
    order: v.optional(v.number()), // for sorting
  }).index("by_userId", ["userId"]),
});
