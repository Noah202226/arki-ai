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
export const add = mutation({
  args: {
    text: v.string(),
    type: v.union(v.literal("task"), v.literal("routine")),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to add a task");
    }

    await ctx.db.insert("tasks", {
      text: args.text,
      type: args.type,
      priority: args.priority ?? "medium",
      isCompleted: false,
      isDeleted: false,
      userId: identity.subject,
      // Default routines have no lastCompleted date initially
      lastCompleted: args.type === "routine" ? 0 : undefined,
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
