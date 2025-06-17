"use client";

import { useLocation } from "react-router-dom";
import Providers from "@/components/Providers";
import RouteCorrecter from "@/components/RouteCorrecter";
import AppSidebar from "@/components/Sidebar";
import QuickOptions from "@/components/QuickOptions";
import { cn, scrollbarStyle } from "@/lib/utils";
import ChatLayout from "./Chat/ChatLayout";

const CHAT_PATHS = ["/", "/thread/"];

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const location = useLocation();
  
  const isChatPath = CHAT_PATHS.some(path => 
    path !== "/" ? location.pathname.startsWith(path) : location.pathname === path
  );

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
                {children}
              </ChatLayout>
            ) : (
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            )}
          </div>
        </main>
      </div>
    </Providers>
  );
}
