import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuth } from "./utils";

export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.query === "" || args.query.length < 3) {
      return { threads: [], messages: [] };
    }

    const threadTitleResults = await ctx.db
      .query("threads")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("userId", userId)
      )
      .collect();

    const threadTagResults = await ctx.db
        .query("threads")
        .withSearchIndex("search_tags", (q) =>
            q.search("tags", args.query).eq("userId", userId)
        )
        .collect();

    const allThreads = [...threadTitleResults, ...threadTagResults];
    const uniqueThreads = Array.from(new Map(allThreads.map(t => [t._id, t])).values());

    const messages = await ctx.db
      .query("messages")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.query).eq("userId", userId)
      )
      .collect();

    const messageThreadIds = new Set(messages.map(m => m.threadId));
    const threadsFromMessages = [];
    for (const threadId of messageThreadIds) {
      if (!uniqueThreads.some(t => t._id === threadId)) {
        const thread = await ctx.db.get(threadId);
        if (thread) {
          threadsFromMessages.push(thread);
        }
      }
    }
    
    const finalThreads = [...uniqueThreads, ...threadsFromMessages];
    const uniqueFinalThreads = Array.from(new Map(finalThreads.map(t => [t._id, t])).values());
    
    const formattedMessages = messages.map(message => ({
      _id: message._id,
      content: message.content,
      threadId: message.threadId,
      role: message.role,
      createdAt: message.createdAt,
    }));
    
    return { 
      threads: uniqueFinalThreads, 
      messages: formattedMessages 
    };
  },
}); 