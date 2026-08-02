import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get realtime data of table
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Get user gamification stats
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { xp: 0, level: 1, streakCount: 0, focusSessionsCompleted: 0 };

    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!stats) {
      return { xp: 0, level: 1, streakCount: 0, focusSessionsCompleted: 0 };
    }

    return stats;
  },
});

// Add task or routine
export const create = mutation({
  args: {
    userId: v.string(),
    text: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("task"), v.literal("routine")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.optional(v.string()),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
    estimatedMinutes: v.optional(v.number()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          isCompleted: v.boolean(),
        })
      )
    ),
    isCompleted: v.boolean(),
    isDeleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    let xpValue = 20;
    if (args.type === "routine") xpValue = 25;
    else if (args.priority === "high") xpValue = 50;
    else if (args.priority === "medium") xpValue = 30;

    return await ctx.db.insert("tasks", {
      userId: args.userId,
      text: args.text,
      description: args.description,
      type: args.type,
      priority: args.priority,
      category: args.category,
      frequency: args.frequency,
      estimatedMinutes: args.estimatedMinutes,
      subtasks: args.subtasks,
      xpValue,
      isCompleted: args.isCompleted,
      isDeleted: args.isDeleted,
    });
  },
});

// Delete task
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});

// Toggle Task/Routine completion with XP & Streak rewarding
export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const newIsCompleted = !task.isCompleted;
    const patchData: { isCompleted: boolean; lastCompleted?: number } = { isCompleted: newIsCompleted };

    if (task.type === "routine" && newIsCompleted) {
      patchData.lastCompleted = Date.now();
    }

    await ctx.db.patch(args.id, patchData);

    const xpAmount = task.xpValue ?? (task.priority === "high" ? 50 : task.priority === "medium" ? 30 : 20);

    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const todayStr = new Date().toISOString().split("T")[0];

    if (!stats) {
      const initialXp = newIsCompleted ? xpAmount : 0;
      await ctx.db.insert("userStats", {
        userId: identity.subject,
        xp: initialXp,
        level: Math.floor(initialXp / 250) + 1,
        streakCount: 1,
        lastActiveDate: todayStr,
        focusSessionsCompleted: 0,
      });
    } else {
      let newXp = newIsCompleted ? stats.xp + xpAmount : Math.max(0, stats.xp - xpAmount);
      let newStreak = stats.streakCount;

      if (newIsCompleted && stats.lastActiveDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (stats.lastActiveDate === yesterdayStr) {
          newStreak += 1;
        } else if (!stats.lastActiveDate) {
          newStreak = 1;
        }
      }

      await ctx.db.patch(stats._id, {
        xp: newXp,
        level: Math.floor(newXp / 250) + 1,
        streakCount: newStreak,
        lastActiveDate: todayStr,
      });
    }

    if (newIsCompleted) {
      await ctx.db.insert("notifications", {
        userId: identity.subject,
        title: "🎉 Task Completed!",
        message: `Task completed: "${task.text}" (+${xpAmount} XP)`,
        type: "task",
        severity: "info",
        isRead: false,
        linkUrl: "/tasks",
        createdAt: Date.now(),
      });
    }
  },
});

// Update subtasks for a task
export const updateSubtasks = mutation({
  args: {
    id: v.id("tasks"),
    subtasks: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        isCompleted: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { subtasks: args.subtasks });
  },
});

// Record completed Pomodoro Focus Session & award bonus XP
export const completeFocusSession = mutation({
  args: {
    taskId: v.optional(v.id("tasks")),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const bonusXp = 100;
    const stats = await ctx.db
      .query("userStats")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const todayStr = new Date().toISOString().split("T")[0];

    if (!stats) {
      await ctx.db.insert("userStats", {
        userId: identity.subject,
        xp: bonusXp,
        level: 1,
        streakCount: 1,
        lastActiveDate: todayStr,
        focusSessionsCompleted: 1,
      });
    } else {
      const newXp = stats.xp + bonusXp;
      await ctx.db.patch(stats._id, {
        xp: newXp,
        level: Math.floor(newXp / 250) + 1,
        focusSessionsCompleted: (stats.focusSessionsCompleted ?? 0) + 1,
        lastActiveDate: todayStr,
      });
    }

    await ctx.db.insert("notifications", {
      userId: identity.subject,
      title: "🧠 Focus Session Complete!",
      message: `Completed a ${args.durationMinutes}-min Focus Block (+${bonusXp} XP)!`,
      type: "task",
      severity: "info",
      isRead: false,
      linkUrl: "/tasks",
      createdAt: Date.now(),
    });
  },
});

export const resetDailyRoutines = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const routines = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "routine"),
          q.eq(q.field("isDeleted"), false),
        ),
      )
      .collect();

    await Promise.all(
      routines
        .filter((r) => r.isCompleted)
        .map((r) =>
          ctx.db.patch(r._id, {
            isCompleted: false,
            lastCompleted: Date.now(),
          }),
        ),
    );

    return { reset: routines.filter((r) => r.isCompleted).length };
  },
});

export const getLastRoutineReset = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const routines = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "routine"),
          q.eq(q.field("isDeleted"), false),
        ),
      )
      .collect();

    const lastCompleted = routines.reduce((max, r) => {
      return r.lastCompleted && r.lastCompleted > max ? r.lastCompleted : max;
    }, 0);

    return { lastCompleted };
  },
});
