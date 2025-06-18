"use client";

import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import ChatMessages from "@/components/Chat/messages/ChatMessages";
import { cn, scrollbarStyle } from "@/lib/utils";
import { convexMessageToUiMessage } from "@/hooks/useChat";
import { LoaderCircle } from "lucide-react";

function SharedThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();

  const data = useQuery(
    api.threads.getPublicThread,
    threadId ? { threadId } : "skip"
  );
  const isLoading = data === undefined;

  const transformedMessages = useMemo(() => {
    if (!data?.messages) return [];
    return data.messages.map(convexMessageToUiMessage);
  }, [data]);


  if (data === null) {
    return <NotFoundState />;
  }
  
  return (
    <div className="flex-1 flex flex-col relative h-full">
        <div className="p-4 border-b">
            <h1 className="text-xl font-semibold">
              {isLoading ? <Skeleton className="w-64 h-7" /> : (data.thread.userTitle || data.thread.title)}
            </h1>
            <p className="text-sm text-muted-foreground">This is a shared thread. You can only view the conversation.</p>
        </div>
        <div className={cn("flex-1 overflow-y-auto", scrollbarStyle)}>
          <ChatMessages messages={transformedMessages} isReadOnly={true} isLoading={isLoading} />
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-4 gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading conversation...</p>
            </div>
          )}
        </div>
    </div>
  );
}

const NotFoundState = () => (
  <div className="flex-1 flex items-center justify-center min-h-full">
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-2">Thread Not Found</h2>
      <p className="text-muted-foreground mb-4">
        This shared thread does not exist or is no longer available.
      </p>
      <Link to="/">
        <Button>
          Create New Chat
        </Button>
      </Link>
    </div>
  </div>
);

export default SharedThreadPage; 