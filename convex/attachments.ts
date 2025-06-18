import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./utils";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createAttachment = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const attachmentId = await ctx.db.insert("attachments", {
      userId,
      storageId: args.storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      createdAt: Date.now(),
    });

    return attachmentId;
  },
});

export const getAttachments = query({
  args: {
    attachmentIds: v.array(v.id("attachments")),
  },
  handler: async (ctx, args) => {
    const attachments = await Promise.all(
      args.attachmentIds.map((id) => ctx.db.get(id))
    );

    const attachmentsWithUrls = await Promise.all(
      attachments
        .filter((attachment) => attachment !== null)
        .map(async (attachment) => {
          const url = await ctx.storage.getUrl(attachment!.storageId);
          if (!url) {
            return null;
          }
          return {
            ...attachment!,
            url,
          };
        })
    );

    return attachmentsWithUrls.filter(
      (attachment): attachment is NonNullable<typeof attachment> =>
        attachment !== null
    );
  },
});

export const getUserAttachments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const url = await ctx.storage.getUrl(attachment.storageId);
        const metadata = await ctx.db.system.get(attachment.storageId);
        
        return {
          ...attachment,
          url,
          size: metadata?.size,
        };
      })
    );

    return attachmentsWithUrls.filter(a => a.url !== null);
  },
});

export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new Error("Attachment not found");
    }

    if (attachment.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.storage.delete(attachment.storageId);
    await ctx.db.delete(args.attachmentId);

    return { success: true };
  },
});

export const deleteMultipleAttachments = mutation({
  args: {
    attachmentIds: v.array(v.id("attachments")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    
    const results = [];
    
    for (const attachmentId of args.attachmentIds) {
      try {
        const attachment = await ctx.db.get(attachmentId);
        if (!attachment) {
          results.push({ id: attachmentId, success: false, error: "Not found" });
          continue;
        }

        if (attachment.userId !== userId) {
          results.push({ id: attachmentId, success: false, error: "Unauthorized" });
          continue;
        }

        await ctx.storage.delete(attachment.storageId);
        await ctx.db.delete(attachmentId);
        
        results.push({ id: attachmentId, success: true });
      } catch (error) {
        results.push({ 
          id: attachmentId, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    return { results };
  },
});

export const getGeneratedImages = query({
  args: {},
  handler: async (ctx) => {
    let userId: Id<"users">;
    try {
      userId = await requireAuth(ctx);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      return [];
    }

    const attachmentsWithMessage = await ctx.db
      .query("attachments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("messageId"), undefined))
      .order("desc")
      .collect();

    const generatedAttachments = attachmentsWithMessage.filter((attachment) =>
      attachment.fileName.startsWith("generated-image-")
    );

    const attachmentsWithDetails = await Promise.all(
      generatedAttachments.map(async (attachment) => {
        const url = await ctx.storage.getUrl(attachment.storageId);
        if (!attachment.messageId) {
          return { ...attachment, url, prompt: null, threadId: null };
        }

        const assistantMessage = await ctx.db.get(attachment.messageId);
        if (!assistantMessage) {
          return { ...attachment, url, prompt: null, threadId: null };
        }

        const userMessage = await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) =>
            q.eq("threadId", assistantMessage.threadId)
          )
          .filter((q) => q.eq(q.field("role"), "user"))
          .filter((q) =>
            q.lt(q.field("_creationTime"), assistantMessage._creationTime)
          )
          .order("desc")
          .first();

        return {
          ...attachment,
          url,
          prompt: userMessage?.content ?? null,
          threadId: assistantMessage.threadId,
        };
      })
    );

    return attachmentsWithDetails.filter((a) => a.url !== null);
  },
}); 