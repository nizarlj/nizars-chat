import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./utils";
import { Id } from "./_generated/dataModel";
import { isUndefined, omitBy } from "lodash";

export const createFolder = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.name.length === 0) {
      throw new Error("Folder name cannot be empty");
    }

    const now = Date.now();
    const folderId = await ctx.db.insert("folders", {
      name: args.name,
      userId,
      createdAt: now,
      updatedAt: now,
      color: args.color,
    });

    return folderId;
  },
});

export const getFolders = query({
  args: {},
  handler: async (ctx) => {
    let userId: Id<"users">;
    try {
      userId = await requireAuth(ctx);
    } catch (error) {
      return [];
    }

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return folders;
  },
});

export const updateFolder = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or you don't have permission to update it");
    }

    if (args.name?.length === 0) {
      throw new Error("Folder name cannot be empty");
    }
    
    const updates = omitBy({
      name: args.name,
      color: args.color,
      updatedAt: Date.now(),
    }, isUndefined);

    await ctx.db.patch(args.folderId, updates);
  },
});

export const deleteFolder = mutation({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or you don't have permission to delete it");
    }

    // Unassign threads from this folder
    const threadsInFolder = await ctx.db
      .query("threads")
      .withIndex("by_user_folder", (q) =>
        q.eq("userId", userId).eq("folderId", args.folderId)
      )
      .collect();

    for (const thread of threadsInFolder) {
      await ctx.db.patch(thread._id, { folderId: undefined });
    }

    await ctx.db.delete(args.folderId);
  },
});

export const moveThreadToFolder = mutation({
  args: {
    threadId: v.id("threads"),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== userId) {
      throw new Error("Thread not found or you don't have permission to move it");
    }

    if (args.folderId) {
        const folder = await ctx.db.get(args.folderId);
        if (!folder || folder.userId !== userId) {
            throw new Error("Folder not found or you don't have permission to move threads to it");
        }
    }

    await ctx.db.patch(args.threadId, {
      folderId: args.folderId,
    });
  },
}); 