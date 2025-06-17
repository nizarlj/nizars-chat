"use client";

import Thread from "@/components/Chat/Thread";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useChatThread } from "@/components/Chat/context";
import { useParams } from "react-router-dom";

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const { thread } = useChatThread();

  // Handle thread loading state
  if (thread === undefined) return null;

  // Handle thread not found
  if (thread === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Thread Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The thread you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link to="/">
            <Button>
              Create New Chat
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <Thread key={threadId || "new-chat"} />;
} 