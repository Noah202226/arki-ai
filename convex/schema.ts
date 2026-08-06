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
    estimatedMinutes: v.optional(v.number()),
    xpValue: v.optional(v.number()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          isCompleted: v.boolean(),
        })
      )
    ),
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
    cutOffPeriod: v.optional(v.string()), // e.g., "May 15 - May 30" (Optional)

    // Computation fields
    baseDailyRate: v.number(),
    isWorked: v.boolean(), // Did you go to work?
    otHours: v.number(), // Number of OT hours
    otHourlyRate: v.number(), // Your OT rate per hour
    lateMinutes: v.optional(v.number()), // Late minutes recorded
    claimed: v.optional(v.boolean()), // Has this cutoff's base pay been claimed?
    claimedAt: v.optional(v.number()), // Unix timestamp of base pay claim
    otClaimed: v.optional(v.boolean()), // Has this cutoff's OT pay been claimed?
    otClaimedAt: v.optional(v.number()), // Unix timestamp of OT claim
    jobId: v.optional(v.id("jobs")), // ID of the job/sideline profile
    jobTitle: v.optional(v.string()), // Title of the job/sideline profile
  }).index("by_userId", ["userId"]),

  // Jobs / Sidelines Profiles (Multiple income rates)
  jobs: defineTable({
    userId: v.string(),
    title: v.string(), // e.g., "Primary Job", "Freelance Client A", "Sideline B"
    baseDailyRate: v.number(),
    otHourlyRate: v.number(),
    lateRatePerMin: v.optional(v.number()),
    color: v.optional(v.string()), // e.g., "#4F46E5" for UI badges
    isDefault: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  payrollSettings: defineTable({
    userId: v.string(),
    baseDailyRate: v.number(),
    otHourlyRate: v.number(),
    currentCutOff: v.optional(v.string()), // Optional cut-off label
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

  // 4. NEW: SUBSCRIPTIONS TABLE (For tracking recurring subscriptions/expenses or client income retainers)
  subscriptions: defineTable({
    userId: v.string(),
    name: v.string(),
    amount: v.number(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("15days"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    nextBillingDate: v.number(), // Unix timestamp (millisecond representation) of next payment
    accountId: v.id("accounts"), // Account from which this subscription is paid or deposited
    categoryId: v.id("categories"), // Category, e.g. "Software", "Salary", "Freelance"
    status: v.string(), // "active", "paused", "cancelled"
    type: v.optional(v.union(v.literal("expense"), v.literal("income"))), // "expense" (outflow) or "income" (client retainer inflow)
    description: v.optional(v.string()), // Notes/details
    isDeleted: v.optional(v.boolean()), // Soft delete support
  }).index("by_userId", ["userId"]),

  // 5. LIFESTYLE COST & REFERENCE SETTINGS (Persisted user inputs)
  lifestyleSettings: defineTable({
    userId: v.string(),
    housingMonthly: v.number(),
    utilitiesMonthly: v.number(),
    foodMonthly: v.number(),
    transportMonthly: v.number(),
    savingsBufferPercent: v.number(),
    useLivePayroll: v.optional(v.boolean()),
    customIncome: v.optional(v.number()),
    useLiveSubscriptions: v.optional(v.boolean()),
    customSubscriptionsCost: v.optional(v.number()),
    useLiveDebt: v.optional(v.boolean()),
    customDebtCost: v.optional(v.number()),
    leisureItems: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          amount: v.number(),
          frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
        })
      )
    ),
  }).index("by_userId", ["userId"]),

  // 6. FINANCIAL GOALS TABLE (Persisted goal system linked to wallets)
  financialGoals: defineTable({
    userId: v.string(),
    name: v.string(),
    targetAmount: v.number(),
    months: v.number(),
    linkedAccountId: v.optional(v.union(v.id("accounts"), v.string())),
    customSaved: v.optional(v.number()),
    category: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  // 7. NOTIFICATIONS TABLE (Realtime alert center & reminders)
  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("subscription"), v.literal("task"), v.literal("credit"), v.literal("system")),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"))),
    isRead: v.boolean(),
    linkUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_read", ["userId", "isRead"]),

  // Track user-deleted notification signatures to prevent auto-resyncing deleted notifications
  dismissedNotifications: defineTable({
    userId: v.string(),
    title: v.string(),
    dismissedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_title", ["userId", "title"]),

  // 8. PWA PUSH SUBSCRIPTIONS TABLE (For Android Status Bar & Lockscreen alerts)
  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // 9. USER STATS & DISCIPLINE GAMIFICATION
  userStats: defineTable({
    userId: v.string(),
    xp: v.number(),
    level: v.number(),
    streakCount: v.number(),
    lastActiveDate: v.optional(v.string()), // Format: YYYY-MM-DD
    focusSessionsCompleted: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // 10. CATEGORY BUDGET LIMITS TABLE
  budgets: defineTable({
    userId: v.string(),
    category: v.string(),
    categoryId: v.optional(v.id("categories")),
    monthlyCap: v.number(),
    rolloverAmount: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // 11. BUDGET TRANSFERS LOG TABLE
  budgetTransfers: defineTable({
    userId: v.string(),
    fromCategory: v.string(),
    toCategory: v.string(),
    amount: v.number(),
    transferredAt: v.number(),
    note: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
