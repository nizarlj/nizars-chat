import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Shared validators
export const messageRole = v.union(v.literal("user"), v.literal("assistant"), v.literal("system"));
export const messageStatus = v.union(
  v.literal("streaming"),
  v.literal("completed"),
  v.literal("error")
);

export const usageMetadata = v.object({
  promptTokens: v.optional(v.number()),
  completionTokens: v.optional(v.number()),
  totalTokens: v.optional(v.number()),
});

export const messageMetadata = v.object({
  duration: v.optional(v.number()),
  usage: v.optional(usageMetadata),
});

const schema = defineSchema({
  ...authTables,
  
  threads: defineTable({
    title: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    model: v.string(),
    pinned: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: messageRole,
    content: v.string(),
    reasoning: v.optional(v.string()),
    streamId: v.optional(v.string()),
    status: messageStatus,
    model: v.string(),
    metadata: v.optional(messageMetadata),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]).index("by_stream_id", ["streamId"]),
});

export default schema;