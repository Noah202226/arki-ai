import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { format } from "date-fns";

export const getTodayUsage = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const usage = await ctx.db
      .query("aiUsage")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    return usage?.scansCount || 0;
  },
});

export const incrementUsage = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const existingUsage = await ctx.db
      .query("aiUsage")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, {
        scansCount: existingUsage.scansCount + 1,
      });
      return existingUsage.scansCount + 1;
    } else {
      await ctx.db.insert("aiUsage", {
        userId: args.userId,
        date: today,
        scansCount: 1,
      });
      return 1;
    }
  },
});
