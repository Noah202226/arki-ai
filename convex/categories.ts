import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. Fetch categories based on the transaction type (income vs expense)
export const getCategories = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // In a real app, you'd also filter by user ID (e.g., ctx.auth.getUserIdentity())
    let q = ctx.db.query("categories");

    if (args.type) {
      q = q.filter((q) => q.eq(q.field("type"), args.type));
    }

    return await q.collect();
  },
});

// 2. Create a new category
export const createCategory = mutation({
  // 1. Remove userId from here. The frontend shouldn't have to provide it.
  args: {
    name: v.string(),
    type: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 2. Define the userId here.
    // When you set up Auth (Clerk/Auth0), you'll get this from ctx.auth.
    const userId = "noa_ligpitan"; // Temporary placeholder

    return await ctx.db.insert("categories", {
      ...args,
      userId, // Attach the ID here before saving to the DB
    });
  },
});

// 3. Delete a category (soft delete or hard delete based on your preference)
export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
