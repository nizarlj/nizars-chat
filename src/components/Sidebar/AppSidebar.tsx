"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { ThreadGroup, TIME_PERIODS, getTimeGroupKey, NewChatButton, UserProfile } from "."
import { useThreads, Thread } from "@/hooks/useThreads"
import { cn, scrollbarStyle } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useLocation } from "react-router-dom"
import { useRouterNavigation } from "@/hooks/useRouterNavigation"

export function AppSidebar() {
  const { threads } = useThreads()
  const prevThreadsRef = useRef<Map<string, Thread['status']>>(new Map());
  const location = useLocation();
  const { navigateInstantly } = useRouterNavigation();
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentThreadsMap = new Map(threads.map(t => [t._id, t.status]));
    
    threads.forEach(thread => {
      const prevStatus = prevThreadsRef.current.get(thread._id);
      const currentStatus = thread.status;

      // Update recently completed state for any thread that finishes
      if (prevStatus === 'streaming' && currentStatus === 'idle') {
        setRecentlyCompleted(prev => new Set(prev).add(thread._id));
        setTimeout(() => {
          setRecentlyCompleted(prev => {
            const newSet = new Set(prev);
            newSet.delete(thread._id);
            return newSet;
          });
        }, 10000);
      }
      
      // Show toasts only for non-active threads
      const isActiveThread = location.pathname.includes(thread._id);
      if (prevStatus && prevStatus !== currentStatus && !isActiveThread) {
        if (currentStatus === 'idle' && prevStatus === 'streaming') {
          toast.success(`"${thread.title}" finished generating.`, {
            description: "A new response is available.",
            id: thread._id,
            action: {
              label: "View",
              onClick: () => navigateInstantly(`/thread/${thread._id}`),
            },
          });
        } else if (currentStatus === 'error') {
          toast.error(`"${thread.title}" failed.`, {
            description: "An error occurred while generating the response.",
            id: thread._id,
            action: {
              label: "Retry",
              onClick: () => navigateInstantly(`/thread/${thread._id}`),
            },
          });
        }
      }
    });

    prevThreadsRef.current = currentThreadsMap;
  }, [threads, location.pathname, navigateInstantly]);

  const groupedThreads = threads.reduce((groups, thread) => {
    const key = getTimeGroupKey(thread)
    if (!groups[key]) groups[key] = []
    groups[key].push(thread)
    return groups
  }, {} as Record<string, Thread[]>)

  return (
    <Sidebar className="transition-all duration-100 ease-in-out">
      <SidebarHeader>
        <div className="flex justify-center items-center h-10">
          <h1 className="text-xl font-bold">Nizars Chat</h1> 
        </div>

        <NewChatButton />
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent className={cn("flex-1 overflow-y-auto", scrollbarStyle)}>
        {TIME_PERIODS.map((period) => (
          <ThreadGroup 
            key={period.key} 
            period={period} 
            threads={groupedThreads[period.key] || []} 
            recentlyCompleted={recentlyCompleted}
          />
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
} 