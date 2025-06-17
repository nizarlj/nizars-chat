import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireThreadAccess, getAuthUserId } from "./utils";
import { Id } from "./_generated/dataModel";
import { cloneDeep } from "lodash";

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

    // Enrich threads with branch information
    const enrichedThreads = await Promise.all(
      threads.map(async (thread) => {
        let branchInfo = null;
        
        if (thread.branchedFromThreadId) {
          const originalThread = await ctx.db.get(thread.branchedFromThreadId);
          if (originalThread && originalThread.userId === userId) {
            branchInfo = {
              originalThread: {
                _id: originalThread._id,
                title: originalThread.title,
              },
              branchedFromMessageId: thread.branchedFromMessageId,
            };
          }
        }

        return {
          ...thread,
          branchInfo,
        };
      })
    );

    // Sort: pinned threads first then by updatedAt desc
    return enrichedThreads.sort((a, b) => {
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
      pinned: !thread.pinned
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
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const now = Date.now();
    // Create a title from the first 20 words of the message
    const title = args.firstMessage.split(" ").slice(0, 20).join(" ");

    const threadId = await ctx.db.insert("threads", {
      title,
      userId,
      model: args.model,
      createdAt: now,
      updatedAt: now,
      pinned: false,
    });

    return threadId;
  }
});

export const updateThreadModel = mutation({
  args: {
    threadId: v.id("threads"),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    await ctx.db.patch(args.threadId, {
      model: args.model
    });
  },
});

export const branchThread = mutation({
  args: {
    originalThreadId: v.id("threads"),
    branchFromMessageId: v.string()
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const originalThread = await requireThreadAccess(ctx, args.originalThreadId, userId);

    const now = Date.now();

    // Create the new branched thread
    const branchedThreadId = await ctx.db.insert("threads", {
      title: originalThread.title,
      userId,
      model: originalThread.model,
      createdAt: now,
      updatedAt: now,
      pinned: false,
      branchedFromThreadId: args.originalThreadId,
      branchedFromMessageId: args.branchFromMessageId,
    });

    const originalMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.originalThreadId))
      .collect();

    const sortedMessages = originalMessages.sort((a, b) => a.createdAt - b.createdAt);

    // Find the index of the branch message
    const branchMessageIndex = sortedMessages.findIndex(m => m._id === args.branchFromMessageId);
    if (branchMessageIndex === -1) {
      throw new Error("Branch message not found in thread");
    }

    const messagesToCopy = sortedMessages.slice(0, branchMessageIndex + 1);
    for (const message of messagesToCopy) {
      const { _id, _creationTime, ...messageData } = message;
      await ctx.db.insert("messages", {
        ...messageData,
        threadId: branchedThreadId
      });
    }

    return branchedThreadId;
  },
}); 