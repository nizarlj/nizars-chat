"use client";

import { useState } from "react";
import { Thread, useThreads } from "@/hooks/useThreads";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Pin, Share2, Copy, RefreshCw, Folder, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { ManageTagsDialog } from "./ManageTagsDialog";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

interface ThreadContextMenuProps {
  thread: Thread;
  children: React.ReactNode;
  onRename: () => void;
}

function MoveToFolderMenu({ thread, onSelect }: { thread: Thread, onSelect: () => void }) {
  const folders = useQuery(api.folders.getFolders) ?? [];
  const moveThreadToFolder = useMutation(api.folders.moveThreadToFolder);

  const handleMove = (folderId?: Id<"folders">) => {
    toast.promise(moveThreadToFolder({ threadId: thread._id, folderId }), {
      loading: "Moving thread...",
      success: "Thread moved",
      error: "Failed to move thread",
    });
    onSelect();
  }

  return (
    <PopoverContent className="w-48 p-1">
      <div className="flex flex-col gap-1 text-sm">
        {folders.length > 0 ? folders.map((folder) => (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" key={folder._id} onClick={() => handleMove(folder._id)}>
            <Folder className="h-4 w-4" />
            <span>{folder.name}</span>
          </Button>
        )) : (
          <div className="text-xs text-gray-500 p-2 text-center">No folders yet</div>
        )}
        {thread.folderId && (
          <>
            <div className="h-px bg-gray-700 my-1" />
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => handleMove(undefined)}>
              <span>Remove from folder</span>
            </Button>
          </>
        )}
      </div>
    </PopoverContent>
  )
}

export function ThreadContextMenu({ thread, children, onRename }: ThreadContextMenuProps) {
  const { deleteThread, togglePin, shareThread, copyShareLink } = useThreads();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveToMenuOpen, setMoveToMenuOpen] = useState(false);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });

  const handleDelete = () => {
    deleteThread(thread._id);
    setIsDeleteDialogOpen(false);
    setMenuOpen(false);
  };

  const handleTogglePin = () => {
    togglePin(thread._id);
    setMenuOpen(false);
  };
  
  const handleRenameClick = () => {
    onRename();
    setMenuOpen(false);
  };

  const handleShare = () => {
    shareThread(thread._id);
    setMenuOpen(false);
  };

  const handleCopyLink = () => {
    copyShareLink(thread._id);
    setMenuOpen(false);
  }
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setAnchorPoint({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const handleOpenTags = () => {
    setIsTagsDialogOpen(true);
    setMenuOpen(false);
  }

  return (
    <>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the thread &quot;{thread.userTitle || thread.title}&quot;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isTagsDialogOpen} onOpenChange={setIsTagsDialogOpen}>
        <ManageTagsDialog thread={thread} setOpen={setIsTagsDialogOpen} />
      </Dialog>

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild onContextMenu={handleContextMenu}>
          {children}
        </PopoverTrigger>
        <PopoverAnchor style={{ position: 'fixed', left: anchorPoint.x, top: anchorPoint.y }} />
        <PopoverContent className="w-56 p-1">
          <div className="flex flex-col gap-1 text-sm">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleTogglePin}>
              <Pin className={cn("h-4 w-4", thread.pinned && "fill-current")} />
              <span>{thread.pinned ? "Unpin" : "Pin"}</span>
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleRenameClick}>
              <Edit className="h-4 w-4" />
              <span>Rename</span>
            </Button>
            
            <Popover open={moveToMenuOpen} onOpenChange={setMoveToMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Folder className="h-4 w-4" />
                  <span>Move to</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </PopoverTrigger>
              <MoveToFolderMenu thread={thread} onSelect={() => setMenuOpen(false)}/>
            </Popover>

            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleOpenTags}>
              <Tag className="h-4 w-4" />
              <span>Manage Tags</span>
            </Button>

            <div className="h-px bg-gray-700 my-1" />

            {thread.shareInfo?.isShared ? (
              <>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                  <span>Copy Share Link</span>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleShare}>
                  <RefreshCw className={cn("h-4 w-4", thread.shareInfo?.isOutOfSync && "text-yellow-500")} />
                  <span>Update Shared Version</span>
                  {thread.shareInfo?.isOutOfSync && <div className="w-2 h-2 rounded-full bg-yellow-500 ml-auto" />}
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            )}

            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-red-500 hover:text-red-600" onClick={() => {
              setIsDeleteDialogOpen(true);
              setMenuOpen(false);
            }}>
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
} 