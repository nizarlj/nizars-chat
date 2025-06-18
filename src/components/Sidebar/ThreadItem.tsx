"use client"

import { Button } from "@/components/ui/button"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Pin, Trash2, Split, LoaderCircle, AlertTriangle, CheckCircle, Share2 } from "lucide-react"
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
import { ThreadContextMenu } from "./ThreadContextMenu"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"

interface ThreadItemProps {
  thread: Thread,
  isRecentlyCompleted: boolean
}

export function ThreadItem({ thread, isRecentlyCompleted }: ThreadItemProps) {
  const { deleteThread, togglePin, renameThread } = useThreads()
  const pathname = useRouterPathname()
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(thread.userTitle || thread.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(thread.userTitle || thread.title);
  }, [thread.userTitle, thread.title]);
  
  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const shouldAppearSelected = pathname === `/thread/${thread._id}`
  const isBranched = !!thread.branchedFromThreadId

  let statusIndicator: React.ReactNode = null;
  let statusTooltip: React.ReactNode = null;
  if (thread.status === 'streaming') {
    statusIndicator = <LoaderCircle className="h-4 w-4 text-blue-500 animate-spin" />;
    statusTooltip = <p>Generating response...</p>;
  } else if (thread.status === 'error') {
    statusIndicator = <AlertTriangle className="h-4 w-4 text-red-500" />;
    statusTooltip = <p>An error occurred.</p>;
  } else if (isRecentlyCompleted) {
    statusIndicator = <CheckCircle className="h-4 w-4 text-green-500" />;
    statusTooltip = <p>Response completed.</p>;
  }

  const handleTogglePin = (e: React.MouseEvent, threadId: Id<"threads">) => {
    e.stopPropagation()
    e.preventDefault()
    togglePin(threadId)
  }

  const handleRename = () => {
    if (title.trim() && title !== (thread.userTitle || thread.title)) {
      renameThread(thread._id, title.trim());
    }
    setIsRenaming(false);
  };

  return (
    <ThreadContextMenu thread={thread} onRename={() => setIsRenaming(true)}>
      <SidebarMenuItem 
        key={thread._id}
        className="group/thread-item"
      >
        <div className="relative">
          <Link to={`/thread/${thread._id}`} className="block w-full" onClick={(e) => { if (isRenaming) e.preventDefault(); }}>
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
                  {statusIndicator && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{statusIndicator}</TooltipTrigger>
                        <TooltipContent>{statusTooltip}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {
                  isBranched || thread.publicThreadId && (
                  <span className="flex items-center justify-start gap-1 mr-2">
                    {isBranched && (
                      <div className="">
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

                    {thread.publicThreadId && (
                      <div className="">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Share2 className={cn("h-3 w-3 text-muted-foreground flex-shrink-0", thread.shareInfo?.isOutOfSync && "text-yellow-500")} />
                            </TooltipTrigger>
                            <TooltipContent>
                              {thread.shareInfo?.isOutOfSync 
                                  ? <p>The shared version is out of date.</p>
                                  : <p>This thread is shared publicly.</p>
                              }
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </span>
                )}
                
                {isRenaming ? (
                   <form action="" className="w-full" onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
                     <Input 
                        ref={inputRef}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRename}
                        className="h-6 w-full"
                     />
                   </form>
                ) : (
                    <span className="w-full truncate">{title}</span>
                )}
              </div>
            </SidebarMenuButton>
          </Link>
          
          {/* Slide-in actions */}
          <div className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex transition-all duration-100",
            "opacity-0 translate-x-2",
            !isRenaming && "group-hover/thread-item:opacity-100 group-hover/thread-item:translate-x-0",
          )}>
            {/* gradient */}
            <div className="h-6 w-7 bg-gradient-to-l from-muted to-transparent" />
            <div className="flex gap-1 items-center bg-muted">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={(e) => handleTogglePin(e, thread._id)}
                tooltip={thread.pinned ? "Unpin" : "Pin"}
              >
                <Pin className={cn(
                  "h-3 w-3 transition-colors",
                  thread.pinned ? "fill-current" : "text-muted-foreground"
                )} />
              </Button>
              <ConfirmationDialog
                trigger={
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      tooltip="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                }
                title="Delete Thread"
                description={`Are you sure you want to delete "${thread.userTitle || thread.title}"? This action cannot be undone.`}
                onConfirm={() => deleteThread(thread._id)}
                confirmText="Delete"
              />
            </div>
          </div>
        </div>
      </SidebarMenuItem>
    </ThreadContextMenu>
  )
} 