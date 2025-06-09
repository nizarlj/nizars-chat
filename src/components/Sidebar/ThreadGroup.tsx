import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar"
import { ThreadItem } from "./ThreadItem"
import { Thread } from "@/hooks/useThreads"
import { TimePeriod } from "./constants"

interface ThreadGroupProps {
  period: TimePeriod
  threads: Thread[]
}

export function ThreadGroup({ period, threads }: ThreadGroupProps) {
  if (!threads?.length) return null
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{period.label}</SidebarGroupLabel>
      <SidebarMenu>
        {threads.map((thread) => (
          <ThreadItem key={thread._id} thread={thread} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
} 