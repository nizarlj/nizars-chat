"use client";

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { cn, scrollbarStyle } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";
import Providers from "@/components/Providers";
import RouteCorrecter from "@/components/RouteCorrecter";
import AppSidebar, { type AppSidebarRef } from "@/components/Sidebar";
import QuickOptions from "@/components/QuickOptions";
import ChatLayout from "./Chat/ChatLayout";
import ThreadPage from "@/components/pages/ThreadPage";
import AuthPage from "@/components/pages/AuthPage";
import SettingsPage from "@/components/pages/SettingsPage";
import SharedThreadPage from "@/components/pages/SharedThreadPage";
import { useRouterNavigation } from "@/hooks/useRouterNavigation";
import { useMetadata } from "@/hooks/useMetadata";
import GalleryPage from "./pages/GalleryPage";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

// Individual thread instance that stays alive
function ThreadInstance({ threadId, isActive }: { threadId: string; isActive: boolean }) {
  return (
    <ChatLayout 
      key={`thread-${threadId}`} 
      threadId={threadId as Id<"threads">}
      isActive={isActive}
    >
      <ThreadPage threadId={threadId as Id<"threads">} />
    </ChatLayout>
  );
}

// New chat instance
function NewChatInstance({ isActive }: { isActive: boolean }) {
  const [newChatId, setNewChatId] = React.useState(() => `new-chat-${Date.now()}`);
  
  // Generate a new chat ID when becoming active
  React.useEffect(() => {
    if (isActive) {
      setNewChatId(`new-chat-${Date.now()}`);
    }
  }, [isActive]);
  
  return (
    <ChatLayout key={newChatId} isActive={isActive} isNewChat={true}>
      <ThreadPage newChat={true} />
    </ChatLayout>
  );
}

// Manager that keeps track of active threads
function ThreadManager() {
  const { threadId: currentThreadId } = useRouterNavigation();
  console.log("currentThreadId", currentThreadId)
  const [activeThreads, setActiveThreads] = React.useState<Set<string>>(new Set());

  // Add current thread to active threads
  React.useEffect(() => {
    if (currentThreadId) {
      setActiveThreads(prev => new Set(prev).add(currentThreadId));
    }
  }, [currentThreadId]);

  // Clean up old threads (keep last 3 threads to prevent memory issues)
  React.useEffect(() => {
    if (activeThreads.size > 3) {
      const threadsArray = Array.from(activeThreads);
      const oldestThreads = threadsArray.slice(0, -3);
      setActiveThreads(prev => {
        const newSet = new Set(prev);
        oldestThreads.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  }, [activeThreads]);

  const isNewChat = !currentThreadId;

  return (
    <div className="flex-1 flex flex-col relative">
      {/* New chat instance */}
      <NewChatInstance isActive={isNewChat} />
      
      {/* Active thread instances */}
      {Array.from(activeThreads).map(threadId => (
        <ThreadInstance
          key={threadId}
          threadId={threadId}
          isActive={threadId === currentThreadId}
        />
      ))}
    </div>
  );
}

function AppContent() {
  useMetadata();
  const sidebarRef = React.useRef<AppSidebarRef>(null);

  // Set up global shortcuts
  useGlobalShortcuts({
    onFocusSearch: () => sidebarRef.current?.focusSearch(),
  });
  
  return (
    <div className="relative flex-1 flex">
      <AppSidebar ref={sidebarRef} />
      <QuickOptions />

      <main className={cn("flex-1 flex overflow-y-auto", scrollbarStyle)}>
        <div className="flex-1 flex flex-col max-w-3xl mx-auto">
          <Routes>
            {/* Auth route */}
            <Route path="/auth" element={
              <div className="flex-1 flex flex-col">
                <AuthPage />
              </div>
            } />
            
            {/* Gallery route */}
            <Route path="/gallery" element={<GalleryPage />} />
            
            {/* Chat routes - managed by ThreadManager */}
            <Route path="/" element={<ThreadManager />} />
            <Route path="/thread/:threadId" element={<ThreadManager />} />
            
            {/* Settings routes */}
            <Route path="/settings" element={
              <div className="flex-1 flex flex-col">
                <SettingsPage />
              </div>
            } />
            <Route path="/settings/:tab" element={
              <div className="flex-1 flex flex-col">
                <SettingsPage />
              </div>
            } />
            
            {/* Share route */}
            <Route path="/share/:threadId" element={<SharedThreadPage />} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <Providers>
        <RouteCorrecter />
        <AppContent />
      </Providers>
    </BrowserRouter>
  );
} 