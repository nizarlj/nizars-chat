"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Thread } from "@/hooks/useThreads"
import { cn } from "@/lib/utils"
import { ChevronRight, Folder, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { Id } from "@convex/_generated/dataModel"
import { FolderContextMenu, UpdateFolderDialog } from "./FolderContextMenu"
import { Button } from "@/components/ui/button"
import { ThreadGroup } from "./ThreadGroup"
import { TIME_PERIODS } from "./constants"

interface FolderGroupProps {
  folder: {
    _id: Id<"folders">
    name: string
    color?: string | null
  }
  groupedThreads: Record<string, Thread[]>
  recentlyCompleted: Set<string>
  className?: string
}

export function FolderGroup({
  folder,
  groupedThreads,
  recentlyCompleted,
  className,
}: FolderGroupProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)

  return (
    <>
      <UpdateFolderDialog folder={folder} open={isUpdateDialogOpen} setOpen={setIsUpdateDialogOpen} />
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("w-full", className)}>
        <DropdownMenu>
          <div className="flex items-center group pr-1">
            <CollapsibleTrigger asChild>
              <div className="flex flex-1 items-center gap-1.5 p-1.5 rounded-md hover:bg-gray-500/10">
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
                <Folder className="w-4 h-4" style={{ color: folder.color || "inherit" }} />
                <span className="text-sm font-medium flex-1 text-left">{folder.name}</span>
              </div>
            </CollapsibleTrigger>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
          </div>
          <FolderContextMenu folder={folder} onOpenUpdateDialog={() => setIsUpdateDialogOpen(true)} />
        </DropdownMenu>
        <CollapsibleContent>
          <div className="ml-2.5 border-l pl-2">
            {Object.keys(groupedThreads).length > 0 ? (
              TIME_PERIODS.map((period) => (
                <ThreadGroup
                  key={period.key}
                  period={period}
                  threads={groupedThreads[period.key] || []}
                  recentlyCompleted={recentlyCompleted}
                  className="p-0"
                />
              ))
            ) : (
              <p className="text-xs text-gray-500 p-2">No chats in this folder</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  )
} 