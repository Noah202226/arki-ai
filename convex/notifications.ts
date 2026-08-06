import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// --- READ: Get User Notifications & Unread Count ---
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { items: [], unreadCount: 0 };

    const items = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    // Sort newest first
    items.sort((a, b) => b.createdAt - a.createdAt);

    const unreadCount = items.filter((n) => !n.isRead).length;

    return {
      items: items.slice(0, 50),
      unreadCount,
    };
  },
});

// --- MUTATION: Mark Single Notification as Read ---
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Notification not found or unauthorized");
    }

    await ctx.db.patch(args.id, { isRead: true });
  },
});

// --- MUTATION: Mark All Notifications as Read ---
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", identity.subject).eq("isRead", false)
      )
      .collect();

    for (const notif of unread) {
      await ctx.db.patch(notif._id, { isRead: true });
    }
  },
});

// --- MUTATION: Delete Single Notification ---
export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Notification not found or unauthorized");
    }

    // Save title to dismissedNotifications to prevent auto-resyncing
    const alreadyDismissed = await ctx.db
      .query("dismissedNotifications")
      .withIndex("by_userId_and_title", (q) =>
        q.eq("userId", identity.subject).eq("title", existing.title)
      )
      .first();

    if (!alreadyDismissed) {
      await ctx.db.insert("dismissedNotifications", {
        userId: identity.subject,
        title: existing.title,
        dismissedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
  },
});

// --- MUTATION: Clear All Notifications ---
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    const now = Date.now();
    for (const notif of all) {
      const alreadyDismissed = await ctx.db
        .query("dismissedNotifications")
        .withIndex("by_userId_and_title", (q) =>
          q.eq("userId", identity.subject).eq("title", notif.title)
        )
        .first();

      if (!alreadyDismissed) {
        await ctx.db.insert("dismissedNotifications", {
          userId: identity.subject,
          title: notif.title,
          dismissedAt: now,
        });
      }
      await ctx.db.delete(notif._id);
    }
  },
});

// --- AUTOMATION: Sync Auto Reminders (Subscriptions, Tasks, Credits) ---
export const syncAutoReminders = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { createdCount: 0 };

    const now = Date.now();
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
    const last24Hours = now - 24 * 60 * 60 * 1000;

    // Fetch existing recent notifications & dismissed notifications
    const recentNotifs = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.gte(q.field("createdAt"), last24Hours))
      .collect();

    const dismissedNotifs = await ctx.db
      .query("dismissedNotifications")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.gte(q.field("dismissedAt"), last24Hours))
      .collect();

    const recentTitles = new Set([
      ...recentNotifs.map((n) => n.title),
      ...dismissedNotifs.map((d) => d.title),
    ]);
    let createdCount = 0;

    // 1. Check Subscriptions Due / Overdue
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.not(q.eq(q.field("isDeleted"), true))
        )
      )
      .collect();

    for (const sub of subscriptions) {
      const isOverdue = sub.nextBillingDate < now;
      const isDueSoon = sub.nextBillingDate <= threeDaysFromNow && sub.nextBillingDate >= now;

      if (isOverdue) {
        const title = `Overdue Payment: ${sub.name}`;
        if (!recentTitles.has(title)) {
          await ctx.db.insert("notifications", {
            userId: identity.subject,
            title,
            message: `${sub.name} (₱${sub.amount.toLocaleString()}) was due on ${new Date(sub.nextBillingDate).toLocaleDateString()}. Please process payment.`,
            type: "subscription",
            severity: "error",
            isRead: false,
            linkUrl: "/financials",
            createdAt: now,
          });
          createdCount++;
        }
      } else if (isDueSoon) {
        const title = `Upcoming Bill: ${sub.name}`;
        if (!recentTitles.has(title)) {
          const days = Math.ceil((sub.nextBillingDate - now) / (1000 * 60 * 60 * 24));
          const dueText = days === 0 ? "today" : `in ${days} day${days > 1 ? "s" : ""}`;

          await ctx.db.insert("notifications", {
            userId: identity.subject,
            title,
            message: `${sub.name} (₱${sub.amount.toLocaleString()}) is due ${dueText}.`,
            type: "subscription",
            severity: "warning",
            isRead: false,
            linkUrl: "/financials",
            createdAt: now,
          });
          createdCount++;
        }
      }
    }

    // 2. Check Credits / Loans Due Soon
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const credit of credits) {
      const todayDate = new Date().getDate();
      if (credit.dueDate === todayDate || credit.dueDate === todayDate + 1) {
        const title = `Loan Payment Due: ${credit.creditorName}`;
        if (!recentTitles.has(title)) {
          await ctx.db.insert("notifications", {
            userId: identity.subject,
            title,
            message: `Monthly installment of ₱${credit.monthlyInstallment.toLocaleString()} for ${credit.creditorName} is due soon.`,
            type: "credit",
            severity: "warning",
            isRead: false,
            linkUrl: "/financials",
            createdAt: now,
          });
          createdCount++;
        }
      }
    }

    // 3. Check Tasks needing completion & Routines not done today
    const userTasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.not(q.eq(q.field("isDeleted"), true)))
      .collect();

    const incompleteTasks = userTasks.filter((t) => t.type === "task" && !t.isCompleted);
    if (incompleteTasks.length > 0) {
      const title = `Tasks Pending Completion (${incompleteTasks.length})`;
      if (!recentTitles.has(title)) {
        const sampleTaskNames = incompleteTasks.slice(0, 2).map((t) => t.text).join(", ");
        const moreSuffix = incompleteTasks.length > 2 ? ` and ${incompleteTasks.length - 2} more` : "";
        await ctx.db.insert("notifications", {
          userId: identity.subject,
          title,
          message: `You have ${incompleteTasks.length} pending task(s) to complete today: ${sampleTaskNames}${moreSuffix}.`,
          type: "task",
          severity: "warning",
          isRead: false,
          linkUrl: "/tasks",
          createdAt: now,
        });
        createdCount++;
      }
    }

    const incompleteRoutines = userTasks.filter((t) => t.type === "routine" && !t.isCompleted);
    if (incompleteRoutines.length > 0) {
      const title = `Routine Alert: ${incompleteRoutines.length} Not Done Today`;
      if (!recentTitles.has(title)) {
        const sampleRoutineNames = incompleteRoutines.slice(0, 2).map((r) => r.text).join(", ");
        const moreSuffix = incompleteRoutines.length > 2 ? ` and ${incompleteRoutines.length - 2} more` : "";
        await ctx.db.insert("notifications", {
          userId: identity.subject,
          title,
          message: `Don't forget your routine today! Yet to complete: ${sampleRoutineNames}${moreSuffix}.`,
          type: "task",
          severity: "info",
          isRead: false,
          linkUrl: "/tasks",
          createdAt: now,
        });
        createdCount++;
      }
    }

    return { createdCount };
  },
});

// --- MUTATION: Save Browser Push Subscription ---
export const savePushSubscription = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check if endpoint already registered for this user
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: identity.subject,
        keys: args.keys,
        userAgent: args.userAgent,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("pushSubscriptions", {
        userId: identity.subject,
        endpoint: args.endpoint,
        keys: args.keys,
        userAgent: args.userAgent,
        createdAt: Date.now(),
      });
    }
  },
});

// --- MUTATION: Remove Push Subscription ---
export const removePushSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing && existing.userId === identity.subject) {
      await ctx.db.delete(existing._id);
    }
  },
});

// --- READ: Check if User Has Active Push Device Registered ---
export const getPushStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isSubscribed: false, count: 0 };

    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    return {
      isSubscribed: subs.length > 0,
      count: subs.length,
    };
  },
});
