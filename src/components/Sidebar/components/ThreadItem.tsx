"use client"

import { Button } from "@/components/ui/button"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Pin, Trash2, Split, LoaderCircle, AlertTriangle, CheckCircle, Share2, Tag } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Id } from "@convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { useThreads, Thread } from "@/hooks/useThreads"
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ThreadContextMenu } from "../context-menus/ThreadContextMenu"
import { useState } from "react"
import { DeleteConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import { EditableTitle } from "./EditableTitle"

interface ThreadItemProps {
  thread: Thread,
  isRecentlyCompleted: boolean,
  query?: string,
}

export function ThreadItem({ thread, isRecentlyCompleted, query }: ThreadItemProps) {
  const { deleteThread, togglePin, renameThread } = useThreads()
  const location = useLocation()
  const [isRenaming, setIsRenaming] = useState(false);
  const title = thread.userTitle || thread.title;

  const shouldAppearSelected = location.pathname === `/thread/${thread._id}`
  const isBranched = !!thread.branchedFromThreadId

  let statusIndicator: React.ReactNode = null;
  let statusTooltip: React.ReactNode = null;
  if (thread.status === 'streaming') {
    statusIndicator = <LoaderCircle className="h-4 w-4 text-primary animate-spin" />;
    statusTooltip = <p>Generating response...</p>;
  } else if (thread.status === 'error') {
    statusIndicator = <AlertTriangle className="h-4 w-4 text-destructive" />;
    statusTooltip = <p>An error occurred.</p>;
  } else if (isRecentlyCompleted) {
    statusIndicator = <CheckCircle className="h-4 w-4 text-emerald-500" />;
    statusTooltip = <p>Response completed.</p>;
  }

  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 dark:bg-primary/30 rounded px-0.5 text-foreground font-medium">
          {part}
        </mark>
      ) : part
    )
  }

  const handleTogglePin = (e: React.MouseEvent, threadId: Id<"threads">) => {
    e.stopPropagation()
    e.preventDefault()
    togglePin(threadId)
  }

  const handleRename = (newTitle: string) => {
    if (newTitle.trim()) {
      renameThread(thread._id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
  }

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
                "w-full text-left transition-all group-hover/thread-item:bg-accent/70 group-hover/thread-item:cursor-pointer min-h-[32px] hover:shadow-sm glow-on-hover",
                shouldAppearSelected && "bg-primary/10 text-foreground border-primary shadow-sm"
              )}
            >
              <div className="flex items-center w-full">
                <div className={cn(
                  "flex items-center justify-center flex-shrink-0 transition-all ease-in-out overflow-hidden",
                  statusIndicator ? "w-4 mr-2" : "w-0 mr-0"
                )}>
                  {statusIndicator && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{statusIndicator}</span>
                      </TooltipTrigger>
                      <TooltipContent>{statusTooltip}</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {
                  (isBranched || thread.publicThreadId || (thread.tags && thread.tags.length > 0)) && (
                  <span className="flex items-center justify-start gap-1 mr-2 flex-shrink-0">
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Tag className={cn(
                                "h-3 w-3 flex-shrink-0 transition-colors",
                                query && thread.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {thread.tags.map(tag => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full transition-colors",
                                    query && tag.toLowerCase().includes(query.toLowerCase())
                                      ? "bg-primary/20 dark:bg-primary/30 text-foreground font-medium"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {isBranched && (
                      <div className="">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Split className="h-3 w-3 text-muted-foreground flex-shrink-0 rotate-180 transition-colors" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Branched from: {thread.branchInfo?.originalThread?.title || 'Unknown thread'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {thread.publicThreadId && (
                      <div className="">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Share2 className={cn(
                                "h-3 w-3 text-muted-foreground flex-shrink-0 transition-colors", 
                                thread.shareInfo?.isOutOfSync && "text-yellow-500"
                              )} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {thread.shareInfo?.isOutOfSync 
                                ? <p>The shared version is out of date.</p>
                                : <p>This thread is shared publicly.</p>
                            }
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </span>
                )}
                
                <EditableTitle
                  initialTitle={title}
                  isRenaming={isRenaming}
                  onRename={handleRename}
                  onCancel={handleCancelRename}
                  containerClassName="flex-1 min-w-0"
                  textClassName="w-full truncate transition-colors"
                  inputClassName="h-5"
                >
                  {query ? <div className="w-full truncate">{highlightText(title, query)}</div> : undefined}
                </EditableTitle>
              </div>
            </SidebarMenuButton>
          </Link>
          
          {/* Slide-in actions */}
          <div className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex transition-all",
            "opacity-0 translate-x-2",
            !isRenaming && "group-hover/thread-item:opacity-100 group-hover/thread-item:translate-x-0",
          )}>
            {/* gradient */}
            <div className="h-6 w-7 bg-gradient-to-l from-sidebar-accent to-transparent" />
            <div className="flex gap-1 items-center bg-sidebar-accent">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                onClick={(e) => handleTogglePin(e, thread._id)}
                tooltip={thread.pinned ? "Unpin" : "Pin"}
              >
                <Pin className={cn(
                  "h-3 w-3 transition-colors",
                  thread.pinned ? "fill-current" : ""
                )} />
              </Button>
              <DeleteConfirmationDialog
                trigger={
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      tooltip="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                }
                title="Delete Thread"
                description={`Are you sure you want to delete?`}
                itemName={thread.userTitle || thread.title}
                onConfirm={() => deleteThread(thread._id)}
              />
            </div>
          </div>
        </div>
      </SidebarMenuItem>
    </ThreadContextMenu>
  )
} 