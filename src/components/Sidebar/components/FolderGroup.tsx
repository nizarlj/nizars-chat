"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Thread } from "@/hooks/useThreads"
import { cn } from "@/lib/utils"
import { ChevronRight, Folder, Edit, Trash2, Palette } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { ContextMenuButton } from "@/components/ui/ContextMenuButton"
import { DeleteConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import { useMultipleDialogState } from "@/hooks/useDialogState"
import { Id } from "@convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { ThreadGroup } from "./ThreadGroup"
import { TIME_PERIODS } from "../constants"
import { useFolders } from "@/hooks/useFolders"
import { Input } from "@/components/ui/input"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { toast } from "sonner"
import { EditableTitle } from "./EditableTitle"
import { ContextMenu } from "@/components/ui/ContextMenu"

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

function EditFolderDialog({ 
  folder, 
  open, 
  onOpenChange 
}: { 
  folder: FolderGroupProps['folder']
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const [name, setName] = useState(folder.name)
  const [color, setColor] = useState(folder.color || undefined)
  const { updateFolder } = useFolders()

  useEffect(() => {
    setName(folder.name)
    setColor(folder.color || undefined)
  }, [folder.name, folder.color])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      try {
        await updateFolder(folder._id, name.trim(), color)
        onOpenChange(false)
      } catch {
        toast.error("Failed to update folder")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>
            Update the name and color of your folder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name..."
            autoFocus
          />
          <div className="mt-4">
            <label className="text-sm font-medium">Color</label>
            <div className="mt-2">
              <ColorPicker selectedColor={color} onSelectColor={setColor} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FolderGroupContextMenuContent({ 
  onRename, 
  onEditColor, 
  onDelete 
}: { 
  onRename: () => void
  onEditColor: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <ContextMenuButton icon={Edit} onClick={onRename}>
        Rename
      </ContextMenuButton>
      <ContextMenuButton icon={Palette} onClick={onEditColor}>
        Edit Color
      </ContextMenuButton>
      <div className="h-px bg-border my-1" />
      <ContextMenuButton icon={Trash2} onClick={onDelete} variant="destructive">
        Delete
      </ContextMenuButton>
    </div>
  )
}

export function FolderGroup({
  folder,
  groupedThreads,
  recentlyCompleted,
  className,
}: FolderGroupProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isRenaming, setIsRenaming] = useState(false)
  const { states: dialogStates, openDialog: openDialog, closeDialog } = useMultipleDialogState({
    edit: false,
    delete: false
  })
  const { deleteFolder, updateFolder } = useFolders()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) {
      // Use requestAnimationFrame to ensure the input is rendered before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isRenaming])



  const handleRename = (newName: string) => {
    if (newName.trim()) {
      updateFolder(folder._id, newName.trim(), folder.color || undefined)
    }
    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    await deleteFolder(folder._id)
  }

  return (
    <>
      <EditFolderDialog 
        folder={folder} 
        open={dialogStates.edit} 
        onOpenChange={(open) => !open && closeDialog('edit')} 
      />
      
      <DeleteConfirmationDialog
        open={dialogStates.delete}
        onOpenChange={(open) => !open && closeDialog('delete')}
        onConfirm={handleDelete}
        title="Delete Folder"
        description="Are you sure you want to delete"
        itemName={folder.name}
      />

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("w-full", className)}>
        <ContextMenu
          content={
            <FolderGroupContextMenuContent
              onRename={() => { setIsRenaming(true) }}
              onEditColor={() => { openDialog('edit') }}
              onDelete={() => { openDialog('delete') }}
            />
          }
          contentClassName="w-48 p-1"
        >
          <div className="group/folder-item relative">
            <CollapsibleTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 p-1.5 rounded-md hover:bg-gray-500/10 cursor-pointer transition-all duration-200 min-h-[28px]",
                !isRenaming && "group-hover/folder-item:bg-muted"
              )}
              onClick={(e) => { if (isRenaming) e.preventDefault(); }}
              >
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform flex-shrink-0",
                    isOpen && "rotate-90",
                  )}
                />
                <Folder className="w-4 h-4 flex-shrink-0" style={{ color: folder.color || "inherit" }} />
                <EditableTitle
                  initialTitle={folder.name}
                  isRenaming={isRenaming}
                  onRename={handleRename}
                  onCancel={handleCancelRename}
                  textClassName="text-sm font-medium flex-1 text-left truncate"
                  inputClassName="h-5 text-sm font-medium px-0 py-0"
                  containerClassName="flex-1"
                />
              </div>
            </CollapsibleTrigger>

            {/* Slide-in actions */}
            <div className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex transition-all duration-100",
              "opacity-0 translate-x-2",
              !isRenaming && "group-hover/folder-item:opacity-100 group-hover/folder-item:translate-x-0",
            )}>
              {/* gradient */}
              <div className="h-6 w-7 bg-gradient-to-l from-muted to-transparent" />
              <div className="flex gap-1 items-center bg-muted">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsRenaming(true); }}
                  tooltip="Rename"
                >
                  <Edit className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); openDialog('edit'); }}
                  tooltip="Edit color"
                >
                  <Palette className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); openDialog('delete'); }}
                  tooltip="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </ContextMenu>

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