"use client"

import { Button } from "@/components/ui/button"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Pin, Trash2 } from "lucide-react"
import CustomLink from "@/components/ui/CustomLink"
import { Id } from "@convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { useThreads, Thread } from "@/hooks/useThreads"

interface ThreadItemProps {
  thread: Thread
}

export function ThreadItem({ thread }: ThreadItemProps) {
  const { deleteThread, togglePin } = useThreads()

  const handleDeleteThread = async (e: React.MouseEvent, threadId: Id<"threads">) => {
    e.stopPropagation()
    e.preventDefault()
    await deleteThread(threadId)
  }

  const handleTogglePin = async (e: React.MouseEvent, threadId: Id<"threads">) => {
    e.stopPropagation()
    e.preventDefault()
    await togglePin(threadId)
  }

  return (
    <SidebarMenuItem 
      key={thread._id}
      className="group/thread-item"
    >
      <div className="relative">
        <CustomLink href={`/thread/${thread._id}`} className="block w-full">
          <SidebarMenuButton 
            className="w-full text-left transition-all duration-200 group-hover/thread-item:bg-muted group-hover/thread-item:cursor-pointer"
          >
            <span className="w-full truncate">{thread.title}</span>
          </SidebarMenuButton>
        </CustomLink>
        
        {/* Slide-in actions */}
        <div className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 flex transition-all duration-100",
          "opacity-0 translate-x-2",
          "group-hover/thread-item:opacity-100 group-hover/thread-item:translate-x-0",
        )}>
          {/* gradient */}
          <div className="h-6 w-7 bg-gradient-to-l from-muted to-transparent" />
          <div className="flex gap-1 items-center bg-muted">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted hover:cursor-pointer"
              onClick={(e) => handleTogglePin(e, thread._id)}
            >
              <Pin className={cn(
                "h-3 w-3 transition-colors",
                thread.pinned ? "fill-current text-primary" : "text-muted-foreground"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground hover:cursor-pointer"
              onClick={(e) => handleDeleteThread(e, thread._id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </SidebarMenuItem>
  )
} 