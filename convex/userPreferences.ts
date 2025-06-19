import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./utils";
import { Id } from "./_generated/dataModel";
import { isUndefined, omitBy } from "lodash";

const defaultPreferences = {
  useOpenRouterForAll: false,
  disabledModels: [] as string[],
  favoriteModels: [] as string[],
  defaultModelId: null,
  theme: "system" as const,
  showHeader: false,
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
      theme: preferences.theme ?? "system",
      showHeader: preferences.showHeader ?? false,
    };
  },
});

export const updateUserPreferences = mutation({
  args: {
    useOpenRouterForAll: v.optional(v.boolean()),
    disabledModels: v.optional(v.array(v.string())),
    favoriteModels: v.optional(v.array(v.string())),
    defaultModelId: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    showHeader: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    const updatedPreferences = omitBy({
      useOpenRouterForAll: args.useOpenRouterForAll,
      disabledModels: args.disabledModels,
      favoriteModels: args.favoriteModels,
      defaultModelId: args.defaultModelId,
      theme: args.theme,
      showHeader: args.showHeader,
    }, isUndefined)

    if (Object.keys(updatedPreferences).length === 0) return existingPreferences?._id;

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, {
        ...updatedPreferences,
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
        theme: args.theme ?? "system",
        showHeader: args.showHeader ?? false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
}); 