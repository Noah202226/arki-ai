import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const addCredit = mutation({
  args: {
    creditorName: v.string(),
    totalAmount: v.number(),
    interest: v.number(),
    monthlyInstallment: v.number(),
    dueDate: v.number(),
    category: v.optional(v.string()),
    depositAccountId: v.optional(v.union(v.id("accounts"), v.string(), v.null())),
    depositAmount: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 1. Insert the new credit record
    const creditId = await ctx.db.insert("credits", {
      userId: identity.subject,
      creditorName: args.creditorName,
      totalAmount: args.totalAmount,
      interest: args.interest,
      monthlyInstallment: args.monthlyInstallment,
      dueDate: args.dueDate,
      category: args.category ?? "General",
      startDate: Date.now(),
      status: "ongoing", // Default status
      totalPaid: 0, // Initial calculation of progress
    });

    // 2. If user specified a deposit account and amount, record an Income transaction & update account balance
    if (args.depositAccountId && args.depositAmount && args.depositAmount > 0) {
      const targetAccountId = args.depositAccountId as Id<"accounts">;
      const accountDoc = await ctx.db.get(targetAccountId);
      const account = accountDoc as { balance: number } | null;

      // Fetch all categories
      const categories = await ctx.db.query("categories").collect();

      // Find specific "Credentials" category for loan proceeds
      const credentialsCategory =
        categories.find((c) => c.name.toLowerCase() === "credentials") ||
        categories.find(
          (c) =>
            c.type === "income" &&
            (c.name.toLowerCase().includes("loan") ||
              c.name.toLowerCase().includes("credit") ||
              c.name.toLowerCase().includes("disbursement"))
        ) ||
        categories.find((c) => c.type === "income") ||
        categories[0];

      const categoryName = credentialsCategory ? credentialsCategory.name : "Credentials";
      const categoryId = credentialsCategory?._id;

      // Insert transaction into financials table
      await ctx.db.insert("financials", {
        userId: identity.subject,
        title: `Loan - ${args.creditorName}`,
        amount: args.depositAmount,
        type: "income",
        category: categoryName,
        categoryId: categoryId,
        accountId: targetAccountId,
        status: "completed",
        frequency: "one-time",
        dueDate: Date.now(),
        isDeleted: false,
      });

      // Update account balance
      if (account && typeof account.balance === "number") {
        await ctx.db.patch(targetAccountId, {
          balance: account.balance + args.depositAmount,
        });
      }
    }

    return creditId;
  },
});

export const getCreditSummary = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // 1. Kunin lahat ng credits (Patrick, Gloan, etc.)
    // Sa loob ng getCreditSummary query
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("status"), "ongoing")) // Pakita lang ang active
      .collect();

    // 2. Kunin lahat ng "Debt Payment" transactions
    const allPayments = await ctx.db
      .query("financials")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const todayAtMidnight = new Date(
      currentYear,
      currentMonth,
      now.getDate(),
    ).getTime();

    // 3. I-map ang payments sa kaukulang credit base sa title
    return credits.map((credit) => {
      // 🔥 Check kung may payment na ginawa ngayong buwan

      const payments = allPayments.filter(
        (tx) => tx.creditId === credit._id && tx.type === "expense",
      );

      const isPaidThisMonth = payments.some((p) => p.dueDate >= startOfMonth);

      let dayOfMonth = credit.dueDate;
      if (dayOfMonth > 31) {
        dayOfMonth = new Date(dayOfMonth).getDate();
      }

      // 2. Kunin kung ano ang HULING araw ng kasalukuyang buwan (e.g., Feb = 28, April = 30)
      // Tip: Ang paggamit ng '0' bilang araw sa susunod na buwan ay magbibigay ng huling araw ng kasalukuyang buwan.
      const lastDayOfCurrentMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
      ).getDate();

      // Siguraduhing hindi lalagpas ang due date sa huling araw ng buwan
      // Kung ang dayOfMonth ay 31, at April ngayon (30 days), ang actualDueDay ay magiging 30.
      const actualDueDay = Math.min(dayOfMonth, lastDayOfCurrentMonth);

      // 2. Kalkulahin ang Next Due Date
      let nextDueDate = new Date(currentYear, currentMonth, actualDueDay);

      // 💡 Kung ang credit ay bagong gawa ngayong kasalukuyang buwan (o bayad na ngayong buwan),
      // ang unang hulog/due date ay magsisimula sa susunod na buwan (next month).
      const creditCreatedMonth = new Date(credit.startDate).getMonth();
      const creditCreatedYear = new Date(credit.startDate).getFullYear();
      const isNewCreditThisMonth =
        creditCreatedMonth === currentMonth && creditCreatedYear === currentYear;

      if (isPaidThisMonth || isNewCreditThisMonth) {
        // Ang next due date ay sa susunod na buwan na
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      //  I-calculate ang isOverdue base sa logic na:
      // Hindi pa bayad ngayong buwan AT hindi bagong credit ngayong buwan AT lumipas na ang due day.
      const isOverdue =
        !isPaidThisMonth &&
        !isNewCreditThisMonth &&
        todayAtMidnight >
          new Date(currentYear, currentMonth, actualDueDay).getTime();

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = credit.totalAmount - totalPaid;

      // Excel-style calculation for remaining months
      const remainingMonths =
        credit.monthlyInstallment > 0
          ? Math.ceil(remainingBalance / credit.monthlyInstallment)
          : 0;

      return {
        ...credit,
        totalPaid,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        remainingMonths: remainingMonths > 0 ? remainingMonths : 0,
        progress: (totalPaid / credit.totalAmount) * 100,
        isPaidThisMonth,
        isOverdue,
        nextPaymentDate: nextDueDate.getTime(),
      };
    });
  },
});

// --- UPDATE: Edit existing credit details ---
export const updateCredit = mutation({
  args: {
    id: v.id("credits"),
    creditorName: v.string(),
    totalAmount: v.number(),
    interest: v.number(),
    monthlyInstallment: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

// --- DELETE: Remove a credit record ---
export const deleteCredit = mutation({
  args: { id: v.id("credits") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const archiveCredit = mutation({
  args: { id: v.id("credits") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const existing = await ctx.db.get(args.id);

    if (!existing || existing.userId !== identity?.subject) {
      throw new Error("Unauthorized");
    }

    // Palitan ang status sa archived
    await ctx.db.patch(args.id, {
      status: "archived",
      archivedAt: Date.now(), // Optional: para alam mo kung kailan natapos bayaran
    });
  },
});
