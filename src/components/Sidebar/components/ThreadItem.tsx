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
    statusIndicator = <LoaderCircle className="h-4 w-4 text-blue-500 animate-spin" />;
    statusTooltip = <p>Generating response...</p>;
  } else if (thread.status === 'error') {
    statusIndicator = <AlertTriangle className="h-4 w-4 text-red-500" />;
    statusTooltip = <p>An error occurred.</p>;
  } else if (isRecentlyCompleted) {
    statusIndicator = <CheckCircle className="h-4 w-4 text-green-500" />;
    statusTooltip = <p>Response completed.</p>;
  }

  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-purple-200 dark:bg-purple-700 rounded px-0.5 text-black dark:text-white font-medium">
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
                "w-full text-left transition-all duration-200 group-hover/thread-item:bg-muted group-hover/thread-item:cursor-pointer min-h-[32px]",
                shouldAppearSelected && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center w-full">
                <div className={cn(
                  "flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
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
                                "h-3 w-3 flex-shrink-0",
                                query && thread.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
                                  ? "text-purple-500"
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
                                    "text-xs px-1.5 py-0.5 rounded-full",
                                    query && tag.toLowerCase().includes(query.toLowerCase())
                                      ? "bg-purple-200 dark:bg-purple-700 text-black dark:text-white font-medium"
                                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
                              <Split className="h-3 w-3 text-muted-foreground flex-shrink-0 rotate-180" />
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
                              <Share2 className={cn("h-3 w-3 text-muted-foreground flex-shrink-0", thread.shareInfo?.isOutOfSync && "text-yellow-500")} />
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
                  textClassName="w-full truncate"
                  inputClassName="h-5"
                >
                  {query ? <div className="w-full truncate">{highlightText(title, query)}</div> : undefined}
                </EditableTitle>
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
              <DeleteConfirmationDialog
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