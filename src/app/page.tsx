"use client";

import Thread from "@/components/Chat/Thread";
import { Button } from "@/components/ui/button";
import InstantLink from "@/components/ui/InstantLink";
import { useChatThread } from "@/components/Chat/context";
import { Id } from "@convex/_generated/dataModel";
import { useInstantPathname } from "@/hooks/useInstantNavigation";
import { useMemo } from "react";
import dynamicImport from "next/dynamic";

const ClientLayout = dynamicImport(() => import("@/components/ClientLayout"), { ssr: false });

export const dynamic = "force-static";

function HomeInner() {
  const instantPathname = useInstantPathname();
  
  // Extract threadId from URL if we're on a thread page
  const threadId = useMemo(() => {
    const match = instantPathname.match(/^\/thread\/([^\/]+)$/);
    return match ? match[1] as Id<"threads"> : undefined;
  }, [instantPathname]);
  
  const { thread } = useChatThread();

  // If we're on a thread URL, handle thread-specific logic
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
          <InstantLink href="/">
            <Button>
              Create New Chat
            </Button>
          </InstantLink>
        </div>
      </div>
    );
  }

  return <Thread key={threadId || "new-chat"} />;
}

export default function Home() {
  return (
    <ClientLayout>
      <HomeInner />
    </ClientLayout>
  );
}
