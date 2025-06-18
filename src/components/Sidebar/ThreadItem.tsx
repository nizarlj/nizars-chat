"use client"

import { Button } from "@/components/ui/button"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Pin, Trash2, Split, LoaderCircle, AlertTriangle, CheckCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Id } from "@convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { useThreads, Thread } from "@/hooks/useThreads"
import { useRouterPathname } from "@/hooks/useRouterNavigation"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThreadItemProps {
  thread: Thread,
  isRecentlyCompleted: boolean
}

export function ThreadItem({ thread, isRecentlyCompleted }: ThreadItemProps) {
  const { deleteThread, togglePin } = useThreads()
  const pathname = useRouterPathname()
  
  const shouldAppearSelected = pathname === `/thread/${thread._id}`
  const isBranched = !!thread.branchedFromThreadId

  let statusIndicator = null;
  if (thread.status === 'streaming') {
    statusIndicator = <LoaderCircle className="h-4 w-4 text-blue-500 animate-spin" />;
  } else if (thread.status === 'error') {
    statusIndicator = <AlertTriangle className="h-4 w-4 text-red-500" />;
  } else if (isRecentlyCompleted) {
    statusIndicator = <CheckCircle className="h-4 w-4 text-green-500" />;
  }

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
        <Link to={`/thread/${thread._id}`} className="block w-full">
          <SidebarMenuButton 
            className={cn(
              "w-full text-left transition-all duration-200 group-hover/thread-item:bg-muted group-hover/thread-item:cursor-pointer",
              shouldAppearSelected && "bg-accent text-accent-foreground"
            )}
          >
            <div className="flex items-center w-full">
              <div className={cn(
                "flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                statusIndicator ? "w-4 mr-2" : "w-0 mr-0"
              )}>
                {statusIndicator}
              </div>

              {isBranched && (
                <div className="mr-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Split className="h-3 w-3 text-muted-foreground flex-shrink-0 rotate-180" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Branched from: {thread.branchInfo?.originalThread?.title || 'Unknown thread'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              <span className="w-full truncate">{thread.title}</span>
            </div>
          </SidebarMenuButton>
        </Link>
        
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
              className="h-6 w-6 p-0 hover:bg-muted"
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
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
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