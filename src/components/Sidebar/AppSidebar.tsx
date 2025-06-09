"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { ThreadGroup, TIME_PERIODS, getTimeGroupKey, NewChatButton } from "."
import { useThreads, Thread } from "@/hooks/useThreads"

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
          <h1 className="text-xl font-bold">Nizars T3 Chat</h1> 
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <NewChatButton />

        <SidebarSeparator className="mx-0" />

        {TIME_PERIODS.map((period) => (
          <ThreadGroup 
            key={period.key} 
            period={period} 
            threads={groupedThreads[period.key] || []} 
          />
        ))}
      </SidebarContent>
    </Sidebar>
  )
} 