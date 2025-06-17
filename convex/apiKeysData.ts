import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { requireAuth } from "./utils";

export const getUserApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return apiKeys.map(key => ({
      ...key,
      // Don't send the actual key to the client for security
      encryptedKey: undefined,
      hasKey: !!key.encryptedKey,
    }));
  },
});

export const getEncryptedApiKey = internalQuery({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) => 
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .first();

    return apiKey;
  },
});

export const upsertEncryptedApiKey = internalMutation({
  args: {
    provider: v.string(),
    keyName: v.string(),
    encryptedKey: v.string(),
    isEnabled: v.optional(v.boolean()),
  },
  returns: v.id("apiKeys"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    // Check if key already exists for this provider
    const existingKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) => 
        q.eq("userId", userId).eq("provider", args.provider)
      )
      .first();

    const now = Date.now();

    if (existingKey) {
      // Update existing key
      await ctx.db.patch(existingKey._id, {
        keyName: args.keyName,
        encryptedKey: args.encryptedKey,
        isEnabled: args.isEnabled ?? true,
        updatedAt: now,
      });
      return existingKey._id;
    } else {
      // Create new key
      return await ctx.db.insert("apiKeys", {
        userId,
        provider: args.provider,
        keyName: args.keyName,
        encryptedKey: args.encryptedKey,
        isEnabled: args.isEnabled ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const toggleApiKey = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey || apiKey.userId !== userId) {
      throw new Error("API key not found or unauthorized");
    }

    await ctx.db.patch(args.keyId, {
      isEnabled: !apiKey.isEnabled,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteApiKey = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey || apiKey.userId !== userId) {
      throw new Error("API key not found or unauthorized");
    }

    await ctx.db.delete(args.keyId);
    return { success: true };
  },
}); 