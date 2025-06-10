import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { messageRole, messageStatus, messageMetadata } from "./schema";
import { requireAuth, requireThreadAccess } from "./utils";

export const getThreadMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const threadId = args.threadId as Id<"threads">;
    await requireThreadAccess(ctx, threadId, userId);

    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .collect();
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
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireThreadAccess(ctx, args.threadId, userId);

    const messageId = await ctx.db.insert("messages", {
      threadId: args.threadId,
      role: "user",
      content: args.content,
      model: "gemini-2.0-flash",
      status: "completed",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.threadId, {
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
    metadata: v.optional(messageMetadata),
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
      
      await ctx.db.patch(existingMessage._id, {
        content: args.content,
        reasoning: args.reasoning,
        metadata: args.metadata,
        status: args.status,
      });
      await ctx.db.patch(existingMessage.threadId, { updatedAt: Date.now() });
      return existingMessage._id;
    } else {
      // Create new message
      if (!args.threadId) {
        throw new Error("threadId is required to create a new message");
      }
      await requireThreadAccess(ctx, args.threadId, userId);
      
      const messageId = await ctx.db.insert("messages", {
        threadId: args.threadId,
        role: "assistant",
        streamId: args.streamId,
        status: "streaming",
        model: "gemini-2.0-flash",
        content: "",
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.threadId, { updatedAt: Date.now() });
      return messageId;
    }
  },
});

