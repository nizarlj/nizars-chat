"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { GalleryHorizontal, MoreVertical, FolderPlus } from "lucide-react"
import { useRouterNavigation } from "@/hooks/useRouterNavigation"
import { NewFolderDialog } from "./NewFolderDialog"
import { useState } from "react"

export function SidebarActions() {
  const { navigateInstantly } = useRouterNavigation()
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)

  return (
    <DropdownMenu>
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
        <NewFolderDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <FolderPlus className="w-4 h-4 mr-2" />
            <span>New Folder</span>
          </DropdownMenuItem>
        </NewFolderDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 