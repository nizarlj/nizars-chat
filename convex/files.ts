import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./utils";

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