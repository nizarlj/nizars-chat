import { query } from "./_generated/server";
import { requireAuth } from "./utils";
import { Id } from "./_generated/dataModel";

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    let userId: Id<"users"> | undefined;
    try {
      userId = await requireAuth(ctx);
    } catch (error) {
      return {
        totalMessages: 0,
        totalThreads: 0,
        totalAttachments: 0,
        totalAttachmentSize: 0,
        messagesThisWeek: 0,
        threadsThisWeek: 0,
        accountCreatedAt: Date.now(),
        accountAgeDays: 0,
        modelUsage: [],
      };
    }
    const user = await ctx.db.get(userId as Id<"users">);
    
    // Get user's threads
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get user's messages
    const allMessages = [];
    for (const thread of threads) {
      const threadMessages = await ctx.db
        .query("messages")
        .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
        .filter((q) => q.eq(q.field("role"), "user"))
        .collect();
      allMessages.push(...threadMessages);
    }
    const messages = allMessages;

    // Get user's attachments
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Calculate total attachment size
    let totalAttachmentSize = 0;
    for (const attachment of attachments) {
      const metadata = await ctx.db.system.get(attachment.storageId);
      if (metadata?.size) {
        totalAttachmentSize += metadata.size;
      }
    }

    // Calculate time-based stats
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const messagesThisWeek = messages.filter(m => m.createdAt >= oneWeekAgo).length;
    const threadsThisWeek = threads.filter(t => t.createdAt >= oneWeekAgo).length;

    // Calculate model usage
    const modelUsage = messages.reduce((acc, message) => {
      if (message.model) {
        acc[message.model] = (acc[message.model] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const modelUsageArray = Object.entries(modelUsage)
      .map(([modelName, count]) => ({
        modelName,
        count,
        percentage: Math.round((count / messages.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 models

    // Get account creation date
    const accountCreatedAt = user?._creationTime || now;
    const accountAgeDays = Math.floor((now - accountCreatedAt) / (24 * 60 * 60 * 1000));

    return {
      totalMessages: messages.length,
      totalThreads: threads.length,
      totalAttachments: attachments.length,
      totalAttachmentSize,
      messagesThisWeek,
      threadsThisWeek,
      accountCreatedAt,
      accountAgeDays,
      modelUsage: modelUsageArray,
    };
  },
}); 