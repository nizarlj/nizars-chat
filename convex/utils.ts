import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export async function requireThreadAccess(
  ctx: QueryCtx | MutationCtx, 
  threadId: Id<"threads">, 
  userId: Id<"users">
) {
  const thread = await ctx.db.get(threadId);
  if (!thread || thread.userId !== userId) {
    throw new Error("Thread not found or access denied");
  }
  return thread;
}