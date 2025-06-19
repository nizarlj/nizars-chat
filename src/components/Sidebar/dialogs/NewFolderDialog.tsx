"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReactNode, useState } from "react"
import { toast } from "sonner"
import { FolderPlus } from "lucide-react"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { useFolders } from "@/hooks/useFolders"

interface NewFolderDialogProps {
  children?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NewFolderDialog({ children, open, onOpenChange }: NewFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState<string | undefined>()
  const { createFolder } = useFolders()

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name) {
      try {
        await createFolder(name, color)
        setName("")
        setColor(undefined)
        handleOpenChange(false)
      } catch {
        toast.error("Failed to create folder")
      }
    }
  }

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Folder</DialogTitle>
        <DialogDescription>
          Enter a name for your new folder.
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
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (isControlled) {
    // When controlled, don't use DialogTrigger
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    )
  }

  // When uncontrolled, use DialogTrigger
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" title="New Folder">
            <FolderPlus size={16} />
          </Button>
        )}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
} 