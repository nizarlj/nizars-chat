"use client"

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Id } from "@convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { useFolders } from "@/hooks/useFolders"

interface FolderContextMenuProps {
  folder: {
    _id: Id<"folders">
    name: string
    color?: string | null
  }
  onOpenUpdateDialog: () => void
}

export function UpdateFolderDialog({ folder, open, setOpen }: { folder: FolderContextMenuProps['folder'], open: boolean, setOpen: (open: boolean) => void }) {
  const [name, setName] = useState(folder.name)
  const [color, setColor] = useState(folder.color || undefined)
  const { updateFolder } = useFolders()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name) {
      try {
        await updateFolder(folder._id, name, color)
        setOpen(false)
      } catch {
        toast.error("Failed to update folder")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Folder</DialogTitle>
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
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


export function FolderContextMenu({ folder, onOpenUpdateDialog }: FolderContextMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { deleteFolder } = useFolders()

  const handleDelete = async () => {
    try {
      await deleteFolder(folder._id)
      setIsDeleteDialogOpen(false)
    } catch {
      toast.error("Failed to delete folder")
    }
  }

  return (
    <>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the folder &quot;{folder.name}&quot;? All threads inside will be moved to the main chat list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onOpenUpdateDialog}>
          <Edit className="w-4 h-4 mr-2" />
          Rename / Change Color
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </>
  )
} 