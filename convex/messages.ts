import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { messageRole, messageStatus, messageMetadata, modelParams } from "./schema";
import { requireAuth, requireThreadAccess } from "./utils";
import { omitBy, isUndefined } from "lodash";

export const getThreadMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const threadId = args.threadId as Id<"threads">;
    try {
      const userId = await requireAuth(ctx);
      await requireThreadAccess(ctx, threadId, userId);
    } catch (error) {
      console.error("Error getting thread messages:", error);
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .collect();

    const allAttachmentIds = [
      ...new Set(messages.flatMap((msg) => msg.attachmentIds || [])),
    ];

    if (allAttachmentIds.length === 0) {
      return messages.map((m) => ({ ...m, attachments: [] }));
    }

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

    return messages.map((message) => ({
      ...message,
      attachments:
        message.attachmentIds
          ?.map((id) => attachmentMap.get(id)!)
          .filter(Boolean) || [],
    }));
  },
});

export const getLatestThreadMessage = query({
  args: { threadId: v.id("threads"), role: v.optional(messageRole) },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("role"), args.role ?? "assistant"	))
      .order("desc")
      .first();
  },
});

export const addUserMessage = mutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    attachmentIds: v.optional(v.array(v.id("attachments"))),
    model: v.string(),
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    const messageId = await ctx.db.insert("messages", {
      threadId: args.threadId,
      userId,
      role: "user",
      content: args.content,
      attachmentIds: args.attachmentIds,
      clientId: args.clientId,
      model: args.model,
      status: "completed",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.threadId, {
      status: "streaming",
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const upsertAssistantMessage = mutation({
  args: {
    streamId: v.string(),
    threadId: v.optional(v.id("threads")),
    content: v.optional(v.string()),
    status: v.optional(messageStatus),
    reasoning: v.optional(v.string()),
    model: v.optional(v.string()),
    metadata: v.optional(messageMetadata),
    modelParams: v.optional(modelParams),
    error: v.optional(v.string()),
    providerMetadata: v.optional(v.any()),
    clientId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_stream_id", (q) => q.eq("streamId", args.streamId))
      .unique();

    if (existingMessage) {
      // Update existing message
      await requireThreadAccess(ctx, existingMessage.threadId, userId);

      // Merge updates with existing message, omitting undefined values
      const updates = omitBy({
        content: args.content,
        reasoning: args.reasoning,
        model: args.model,
        status: args.status,
        modelParams: args.modelParams,
        error: args.error,
        providerMetadata: args.providerMetadata,
        clientId: args.clientId,
      }, isUndefined);

      if (args.metadata) {
        updates.metadata = { ...existingMessage.metadata, ...args.metadata };
      }

      await ctx.db.patch(existingMessage._id, updates);
      
      const threadUpdates: Partial<Doc<"threads">> = { updatedAt: Date.now() };
      if (args.status === "completed") threadUpdates.status = "idle";
      else if (args.status === "error") threadUpdates.status = "error";
      await ctx.db.patch(existingMessage.threadId, threadUpdates);

      return existingMessage._id;
    } else {
      // Create new message
      if (!args.threadId) {
        throw new Error("threadId is required to create a new message");
      }
      await requireThreadAccess(ctx, args.threadId, userId);
      
      if (!args.model) {
        throw new Error("model is required to create a new message");
      }

      const messageId = await ctx.db.insert("messages", {
        threadId: args.threadId,
        userId,
        role: "assistant",
        streamId: args.streamId,
        status: "streaming",
        content: "",
        model: args.model,
        modelParams: args.modelParams,
        metadata: args.metadata,
        clientId: args.clientId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.threadId, { updatedAt: Date.now(), status: "streaming" });
      return messageId;
    }
  },
});

export const addAttachmentsToMessage = mutation({
  args: {
    streamId: v.string(),
    attachmentIds: v.array(v.id("attachments")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_stream_id", (q) => q.eq("streamId", args.streamId))
      .unique();

    if (!existingMessage) {
      throw new Error("Message not found");
    }

    await requireThreadAccess(ctx, existingMessage.threadId, userId);

    const currentAttachmentIds = existingMessage.attachmentIds || [];
    const updatedAttachmentIds = [...currentAttachmentIds, ...args.attachmentIds];

    await ctx.db.patch(existingMessage._id, {
      attachmentIds: updatedAttachmentIds,
    });

    // Update attachments with the messageId
    for (const attachmentId of args.attachmentIds) {
      await ctx.db.patch(attachmentId, {
        messageId: existingMessage._id,
      });
    }

    return existingMessage._id;
  },
});

export const deleteMessagesFrom = mutation({
  args: {
    threadId: v.id("threads"),
    messageId: v.id("messages"),
    includeMessage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    const targetIndex = allMessages.findIndex(msg => msg._id === args.messageId);
    if (targetIndex === -1) {
      throw new Error("Message not found in thread");
    }

    const startIndex = args.includeMessage ? targetIndex : targetIndex + 1;
    const messagesToDelete = allMessages.slice(startIndex);

    for (const message of messagesToDelete) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.patch(args.threadId, {
      updatedAt: Date.now(),
    });

    return messagesToDelete.length;
  },
});

export const deleteMessagesForResubmit = mutation({
  args: {
    threadId: v.id("threads"),
    fromMessageId: v.id("messages"),
    includeFromMessage: v.optional(v.boolean()),
    preserveAfterTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    const fromIndex = allMessages.findIndex(msg => msg._id === args.fromMessageId);
    if (fromIndex === -1) {
      throw new Error("From message not found in thread");
    }

    const startIndex = args.includeFromMessage ? fromIndex : fromIndex + 1;
    
    if (args.preserveAfterTimestamp) {
      // Delete messages from startIndex up to (but not including) messages created after the timestamp
      const messagesToDelete = allMessages
        .slice(startIndex)
        .filter(msg => msg.createdAt < args.preserveAfterTimestamp!);
      
      for (const message of messagesToDelete) {
        await ctx.db.delete(message._id);
      }
    } else {
      // If no timestamp provided, delete everything from the start point
      const messagesToDelete = allMessages.slice(startIndex);
      for (const message of messagesToDelete) {
        await ctx.db.delete(message._id);
      }
    }

    await ctx.db.patch(args.threadId, {
      updatedAt: Date.now(),
    });

    return 0;
  },
});

