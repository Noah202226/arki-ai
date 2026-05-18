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
    isCompleted: v.boolean(),
    isDeleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      userId: args.userId,
      text: args.text,
      description: args.description,
      type: args.type,
      priority: args.priority,
      category: args.category,
      frequency: args.frequency,
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

// Toggle Task/Routine completion
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
    const patchData: any = { isCompleted: newIsCompleted };

    // Logic: If it's a routine and we are marking it as "Done",
    // we update the lastCompleted timestamp to NOW.
    if (task.type === "routine" && newIsCompleted) {
      patchData.lastCompleted = Date.now();
    }

    await ctx.db.patch(args.id, patchData);
  },
});
