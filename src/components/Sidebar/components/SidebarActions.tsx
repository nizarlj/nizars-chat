"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { GalleryHorizontal, MoreVertical, FolderPlus } from "lucide-react"
import { useRouterNavigation } from "@/hooks/useRouterNavigation"
import { NewFolderDialog } from "../dialogs/NewFolderDialog"
import { useState } from "react"

export function SidebarActions() {
  const { navigateInstantly } = useRouterNavigation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)

  const handleNewFolderClick = () => {
    setDropdownOpen(false)
    setNewFolderDialogOpen(true)
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
      
      <NewFolderDialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen} />
    </>
  )
} 