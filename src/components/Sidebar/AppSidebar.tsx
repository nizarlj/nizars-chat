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

export function AppSidebar() {
  const { threads } = useThreads()

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
          />
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
} 