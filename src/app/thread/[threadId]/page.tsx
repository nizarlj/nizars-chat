"use client";

import Thread from "@/components/Chat/Thread";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import CustomLink from "@/components/ui/CustomLink";
import { useParams } from "next/navigation";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as Id<"threads">;
  
  const thread = useQuery(
    api.threads.getThread,
    threadId ? { threadId } : "skip"
  );

  // Handle thread loading state
  if (threadId && thread === undefined) return null;

  // Handle thread not found
  if (thread === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Thread Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The thread you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <CustomLink href="/">
            <Button>
              Create New Chat
            </Button>
          </CustomLink>
        </div>
      </div>
    );
  }

  return (
    <Thread key={threadId} />
  );
} 