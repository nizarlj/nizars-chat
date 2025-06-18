import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

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

export const apiKeyUsage = v.object({
  id: v.id("apiKeys"),
  provider: v.string(),
});

export const messageMetadata = v.object({
  duration: v.optional(v.number()),
  usage: v.optional(usageMetadata),
  apiKey: v.optional(apiKeyUsage),
});

export const modelParams = v.object({
  // Chat model parameters
  temperature: v.optional(v.number()),
  topP: v.optional(v.number()),
  topK: v.optional(v.number()),
  maxTokens: v.optional(v.number()),
  presencePenalty: v.optional(v.number()),
  frequencyPenalty: v.optional(v.number()),
  seed: v.optional(v.number()),
  reasoningEffort: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  includeSearch: v.optional(v.boolean()),
  
  // Image generation parameters
  size: v.optional(v.string()), // e.g., "1024x1024"
  aspectRatio: v.optional(v.string()), // e.g., "16:9"
  n: v.optional(v.number()), // number of images to generate
  quality: v.optional(v.string()), // e.g., "hd", "standard"
  style: v.optional(v.string()), // e.g., "vivid", "natural"
});
export type ModelParams = Infer<typeof modelParams>;

const schema = defineSchema({
  users: defineTable({
    // Fields are optional - Better Auth will handle user metadata
  }),
  
  threads: defineTable({
    title: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    model: v.string(),
    status: v.optional(v.union(v.literal("streaming"), v.literal("idle"), v.literal("error"))),
    pinned: v.optional(v.boolean()),
    branchedFromThreadId: v.optional(v.id("threads")),
    branchedFromMessageId: v.optional(v.string()),
    userTitle: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    publicThreadId: v.optional(v.id("threads")),
    originalThreadId: v.optional(v.id("threads")),
    sourceThreadUpdatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    clientId: v.optional(v.string()),
    role: messageRole,
    content: v.string(),
    attachmentIds: v.optional(v.array(v.id("attachments"))),
    reasoning: v.optional(v.string()),
    streamId: v.optional(v.string()),
    status: messageStatus,
    model: v.string(),
    metadata: v.optional(messageMetadata),
    providerMetadata: v.optional(v.any()),
    modelParams: v.optional(modelParams),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]).index("by_stream_id", ["streamId"]),

  attachments: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    keyName: v.string(),
    encryptedKey: v.string(),
    isEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    useOpenRouterForAll: v.boolean(),
    disabledModels: v.array(v.string()),
    favoriteModels: v.array(v.string()),
    defaultModelId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});

export default schema;