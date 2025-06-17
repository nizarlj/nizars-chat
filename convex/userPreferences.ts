import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./utils";
import { Id } from "./_generated/dataModel";

const defaultPreferences = {
  useOpenRouterForAll: false,
  disabledModels: [] as string[],
  favoriteModels: [] as string[],
  defaultModelId: null,
};

export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    let userId: Id<"users"> | null = null;
    try {
      userId = await requireAuth(ctx);
    } catch (error) {
      return defaultPreferences;
    }
    
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!preferences) return defaultPreferences;

    return {
      useOpenRouterForAll: preferences.useOpenRouterForAll,
      disabledModels: preferences.disabledModels,
      favoriteModels: preferences.favoriteModels,
      defaultModelId: preferences.defaultModelId,
    };
  },
});

export const updateUserPreferences = mutation({
  args: {
    useOpenRouterForAll: v.optional(v.boolean()),
    disabledModels: v.optional(v.array(v.string())),
    favoriteModels: v.optional(v.array(v.string())),
    defaultModelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, {
        ...(args.useOpenRouterForAll !== undefined && { useOpenRouterForAll: args.useOpenRouterForAll }),
        ...(args.disabledModels !== undefined && { disabledModels: args.disabledModels }),
        ...(args.favoriteModels !== undefined && { favoriteModels: args.favoriteModels }),
        ...(args.defaultModelId !== undefined && { defaultModelId: args.defaultModelId }),
        updatedAt: now,
      });
      return existingPreferences._id;
    } else {
      // Create new preferences
      return await ctx.db.insert("userPreferences", {
        userId,
        useOpenRouterForAll: args.useOpenRouterForAll ?? false,
        disabledModels: args.disabledModels ?? [],
        favoriteModels: args.favoriteModels ?? [],
        defaultModelId: args.defaultModelId,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
}); 