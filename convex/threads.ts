import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireThreadAccess, getAuthUserId } from "./utils";
import { Id } from "./_generated/dataModel";
import { isUndefined, omitBy } from "lodash";

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
      status: "idle",
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
      .filter((q) => q.neq(q.field("isPublic"), true))
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

        let shareInfo = null;
        if (thread.publicThreadId) {
          const publicThread = await ctx.db.get(thread.publicThreadId);
          if (publicThread) {
            shareInfo = {
              isShared: true,
              isOutOfSync: thread.updatedAt > (publicThread.sourceThreadUpdatedAt ?? 0),
            };
          }
        } else {
          shareInfo = { isShared: false, isOutOfSync: false };
        }

        return {
          ...thread,
          branchInfo,
          shareInfo,
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

export const renameThread = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.optional(v.string()),
    userTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    const update = omitBy({
      title: args.title,
      userTitle: args.userTitle
    }, isUndefined);

    await ctx.db.patch(args.threadId, update);
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
      status: "idle",
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
      status: "idle",
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

export const shareThread = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const originalThread = await requireThreadAccess(ctx, args.threadId, userId);
    const now = Date.now();

    // If a public copy already exists, update it
    if (originalThread.publicThreadId) {
      const publicThreadId = originalThread.publicThreadId;

      // Delete old messages from the public thread
      const oldMessages = await ctx.db
        .query("messages")
        .withIndex("by_thread", (q) => q.eq("threadId", publicThreadId))
        .collect();
      await Promise.all(oldMessages.map(m => ctx.db.delete(m._id)));
      
      // Copy new messages
      const originalMessages = await ctx.db
        .query("messages")
        .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
        .collect();
      
      await Promise.all(originalMessages.map(message => {
        const { _id, _creationTime, threadId, ...messageData } = message;
        return ctx.db.insert("messages", {
          ...messageData,
          threadId: publicThreadId,
        });
      }));

      // Update the timestamp on the public thread
      await ctx.db.patch(publicThreadId, {
        title: originalThread.title,
        userTitle: originalThread.userTitle,
        sourceThreadUpdatedAt: originalThread.updatedAt,
        updatedAt: now
      });

      return publicThreadId;
    }

    // If no public copy exists, create a new one
    const { _id, _creationTime, status, pinned, publicThreadId, ...sharedThreadData } = originalThread;

    const publicThreadIdNew = await ctx.db.insert("threads", {
      ...sharedThreadData,
      createdAt: now,
      updatedAt: now,
      isPublic: true,
      originalThreadId: originalThread._id,
      sourceThreadUpdatedAt: originalThread.updatedAt,
    });
    
    // Copy messages
    const originalMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    for (const message of originalMessages) {
      const { _id, _creationTime, threadId, ...messageData } = message;
      await ctx.db.insert("messages", {
        ...messageData,
        threadId: publicThreadIdNew,
      });
    }

    // Link the original thread to the public one
    await ctx.db.patch(originalThread._id, { publicThreadId: publicThreadIdNew });
    return publicThreadIdNew;
  }
});

export const getPublicThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    try {
      const threadIdTyped = args.threadId as Id<"threads">;
      const thread = await ctx.db.get(threadIdTyped);

      if (!thread || !thread.isPublic) {
        return null;
      }

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_thread", (q) => q.eq("threadId", threadIdTyped))
        .order("asc")
        .collect();
      
      const allAttachmentIds = [
        ...new Set(messages.flatMap((msg) => msg.attachmentIds || [])),
      ];
  
      const attachments = await Promise.all(
        allAttachmentIds.map((id) => ctx.db.get(id))
      );
  
      const attachmentsWithUrls = (
        await Promise.all(
          attachments.filter(Boolean).map(async (attachment) => {
            if (!attachment) return null;
            const url = await ctx.storage.getUrl(attachment.storageId);
            if (!url) return null;
            return { ...attachment, url };
          })
        )
      ).filter((a): a is NonNullable<typeof a> => a !== null);
  
      const attachmentMap = new Map(
        attachmentsWithUrls.map((a) => [a._id, a])
      );
  
      const messagesWithAttachments = messages.map((message) => ({
        ...message,
        attachments:
          message.attachmentIds
            ?.map((id) => attachmentMap.get(id)!)
            .filter(Boolean) || [],
      }));

      return {
        thread,
        messages: messagesWithAttachments,
      };
    } catch (error) {
      console.error("Error fetching public thread:", error);
      return null;
    }
  },
}); 