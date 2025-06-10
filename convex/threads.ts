import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuth, requireThreadAccess } from "./utils";
import { Id } from "./_generated/dataModel";

export const createThread = mutation({
  args: {
    title: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      userId,
      model: args.model,
      createdAt: now,
      updatedAt: now,
      pinned: false,
    });

    return threadId;
  },
});

export const getUserThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort: pinned threads first then by updatedAt desc
    return threads.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  },
});

// Take in string to handle invalid ids gracefully
export const getThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    try {
      const thread = await ctx.db.get(args.threadId as Id<"threads">);
    if (!thread || thread.userId !== userId) {
      return null;
      }

      return thread;
    } catch (error) {
      console.error("Error getting thread", error);
      return null;
    }
  },
});

export const updateThreadTitle = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    await ctx.db.patch(args.threadId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const togglePin = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const thread = await requireThreadAccess(ctx, args.threadId, userId);

    await ctx.db.patch(args.threadId, {
      pinned: !thread.pinned,
      updatedAt: Date.now(),
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.threadId);
  },
});

export const createThreadForChat = mutation({
  args: {
    firstMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const now = Date.now();
    // Create a title from the first 20 words of the message
    const title = args.firstMessage.split(" ").slice(0, 20).join(" ");

    const threadId = await ctx.db.insert("threads", {
      title,
      userId,
      model: "gemini-2.0-flash",
      createdAt: now,
      updatedAt: now,
      pinned: false,
    });

    return threadId;
  }
}); 