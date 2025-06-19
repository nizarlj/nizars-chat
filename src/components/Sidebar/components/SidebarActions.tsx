"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { GalleryHorizontal, MoreVertical, FolderPlus, Keyboard } from "lucide-react"
import { useRouterNavigation } from "@/hooks/useRouterNavigation"
import { NewFolderDialog } from "../dialogs/NewFolderDialog"
import { KeyboardShortcuts } from "@/components/Header"
import { useState } from "react"

export function SidebarActions() {
  const { navigateInstantly } = useRouterNavigation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false)

  const handleNewFolderClick = () => {
    setDropdownOpen(false)
    setNewFolderDialogOpen(true)
  }

  const handleKeyboardShortcutsClick = () => {
    setDropdownOpen(false)
    setKeyboardShortcutsOpen(true)
  }

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleKeyboardShortcutsClick}>
            <Keyboard className="w-4 h-4 mr-2" />
            <span>Keyboard Shortcuts</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigateInstantly("/gallery")}>
            <GalleryHorizontal className="w-4 h-4 mr-2" />
            <span>Gallery</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNewFolderClick}>
            <FolderPlus className="w-4 h-4 mr-2" />
            <span>New Folder</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <KeyboardShortcuts 
        open={keyboardShortcutsOpen} 
        onOpenChange={setKeyboardShortcutsOpen}
      />
      <NewFolderDialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen} />
    </>
  )
} 