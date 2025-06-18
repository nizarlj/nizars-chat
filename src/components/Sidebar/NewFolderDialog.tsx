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
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { FolderPlus } from "lucide-react"
import { ColorPicker } from "@/components/ui/ColorPicker"

interface NewFolderDialogProps {
  children?: ReactNode
}

export function NewFolderDialog({ children }: NewFolderDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState<string | undefined>()
  const createFolder = useMutation(api.folders.createFolder)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name) {
      toast.promise(createFolder({ name, color }), {
        loading: "Creating folder...",
        success: () => {
          setName("")
          setColor(undefined)
          setOpen(false)
          return "Folder created"
        },
        error: "Failed to create folder",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" title="New Folder">
            <FolderPlus size={16} />
          </Button>
        )}
      </DialogTrigger>
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
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 