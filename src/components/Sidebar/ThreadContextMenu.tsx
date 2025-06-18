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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Pin, Share2, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadContextMenuProps {
  thread: Thread;
  children: React.ReactNode;
  onRename: () => void;
}

export function ThreadContextMenu({ thread, children, onRename }: ThreadContextMenuProps) {
  const { deleteThread, togglePin, shareThread, copyShareLink } = useThreads();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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

            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </DialogTrigger>
          </div>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This will permanently delete the thread "{thread.userTitle || thread.title}". This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 