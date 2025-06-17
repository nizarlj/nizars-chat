import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { betterAuthComponent } from "./auth";

export async function requireAuth(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<Id<"users">> {
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

export async function getAuthUserId(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<Id<"users"> | null> {
  const userId = await betterAuthComponent.getAuthUserId(ctx);
  return userId as Id<"users">;
}