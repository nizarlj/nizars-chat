"use client";

import { useInstantPathname, useInstantNavigation } from "@/hooks/useInstantNavigation";
import Providers from "@/components/Providers";
import RouteCorrecter from "@/components/RouteCorrecter";
import AppSidebar from "@/components/Sidebar";
import QuickOptions from "@/components/QuickOptions";
import { cn, scrollbarStyle } from "@/lib/utils";
import ChatLayout from "./Chat/ChatLayout";

const CHAT_PATHS = ["/", "/thread/"];

export default function ClientLayout({
  children,
  paths=[],
}: Readonly<{
  children: React.ReactNode;
  paths: string[];
}>) {
  const instantPathname = useInstantPathname();
  const { isNavigating, navigatingTo } = useInstantNavigation();
  
  const canRenderOnPath = paths.some(path => path !== "/" ? instantPathname.startsWith(path) : instantPathname === path);
  
  const currentIsChatPath = CHAT_PATHS.some(path => path !== "/" ? instantPathname.startsWith(path) : instantPathname === path);
  const navigatingToChatPath = navigatingTo ? CHAT_PATHS.some(path => path !== "/" ? navigatingTo.startsWith(path) : navigatingTo === path) : false;
  const isChatPath = currentIsChatPath || (isNavigating && navigatingToChatPath);
  
  const canRenderOnNavigatingTo = navigatingTo ? paths.some(path => path !== "/" ? navigatingTo.startsWith(path) : navigatingTo === path) : false;
  const shouldShowContent = canRenderOnPath || (isNavigating && canRenderOnNavigatingTo);

  return (
    <Providers>
      <RouteCorrecter />
      <div className="relative flex-1 flex">
        <AppSidebar />
        <QuickOptions />

        <main className={cn("flex-1 flex overflow-y-auto", scrollbarStyle)}>
          <div className="flex-1 flex flex-col max-w-3xl mx-auto">
            {isChatPath ? (
              <ChatLayout>
                {shouldShowContent && children}
              </ChatLayout>
            ) : (
              <div className="flex-1 flex flex-col">
                {shouldShowContent && children}
              </div>
            )}
          </div>
        </main>
      </div>
    </Providers>
  );
}
