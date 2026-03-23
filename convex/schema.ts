import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.string(),
  }).index("by_userId", ["userId"]),

  // 1. FINANCIALS TABLE (Payables & Subscriptions)
  financials: defineTable({
    userId: v.string(),
    title: v.string(),
    amount: v.number(),
    type: v.string(), // "income" or "expense"
    category: v.string(), // Idagdag ito
    accountId: v.id("accounts"), // Idagdag ito para ma-link sa Wallet
    status: v.string(), // "completed", "pending", "paid"
    frequency: v.string(),
    dueDate: v.number(),
  }).index("by_userId_and_date", ["userId", "dueDate"]),

  // 2. ACCOUNTS TABLE (Balances: GCash, Bank, etc.)
  accounts: defineTable({
    userId: v.string(),
    accountName: v.string(),
    balance: v.number(),
    currency: v.string(),
  }).index("by_userId", ["userId"]),

  // 3. NEW: INCOME TABLE (Dito natin ilalagay ang Income Monitoring)
  income: defineTable({
    userId: v.string(),
    source: v.string(), // e.g., "Salary", "Freelance", "GCash Cash-in"
    amount: v.number(),
    dateReceived: v.number(), // Unix timestamp
    accountId: v.id("accounts"), // I-li-link natin kung saang account pumasok ang pera
    category: v.string(), // e.g., "Active", "Passive", "Gift"
  }).index("by_userId_and_date", ["userId", "dateReceived"]),

  // Credit Schema
  credits: defineTable({
    userId: v.string(),
    creditorName: v.string(),
    totalAmount: v.number(),
    interest: v.number(),
    monthlyInstallment: v.number(),
    startDate: v.number(),
    status: v.string(),
  }).index("by_userId", ["userId"]),
});
