import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar"
import { ThreadItem } from "./ThreadItem"
import { Thread } from "@/hooks/useThreads"
import { TimePeriod } from "./constants"
import { Pin } from "lucide-react"

interface ThreadGroupProps {
  period: TimePeriod
  threads: Thread[]
  recentlyCompleted: Set<string>
}

export function ThreadGroup({ period, threads, recentlyCompleted }: ThreadGroupProps) {
  if (!threads?.length) return null
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <div className="flex items-center gap-1">
          {period.key === "pinned" && <Pin className="w-3 h-3" />}
          <span>{period.label}</span>
        </div>
      </SidebarGroupLabel>
      <SidebarMenu>
        {threads.map((thread) => (
          <ThreadItem 
            key={thread._id} 
            thread={thread} 
            isRecentlyCompleted={recentlyCompleted.has(thread._id)}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
} 