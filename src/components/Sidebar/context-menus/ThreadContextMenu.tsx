"use client";

import { Thread, useThreads } from "@/hooks/useThreads";
import { useFolders } from "@/hooks/useFolders";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Trash2, Edit, Pin, Share2, Copy, RefreshCw, Folder, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManageTagsDialog } from "../dialogs/ManageTagsDialog";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenuButton } from "@/components/ui/ContextMenuButton";
import { DeleteConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useMultipleDialogState } from "@/hooks/useDialogState";

interface ThreadContextMenuProps {
  thread: Thread;
  children: React.ReactNode;
  onRename: () => void;
}

interface MoveToFolderMenuProps {
  thread: Thread
  children: React.ReactNode
}

function MoveToFolderMenu({ thread, children }: MoveToFolderMenuProps) {
  const { folders, moveThreadToFolder } = useFolders();

  const handleMove = async (folderId?: Id<"folders">) => {
    try {
      await moveThreadToFolder(thread._id, folderId);
    } catch {
      toast.error("Failed to move thread");
    }
  }

  const content = (
    <div className="flex flex-col gap-1 text-xs">
      {folders.length > 0 ? folders.map((folder) => (
        <Tooltip key={folder._id}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7" key={folder._id} onClick={() => handleMove(folder._id)}>
              <Folder className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{folder.name}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{folder.name}</TooltipContent>
        </Tooltip>
      )) : (
        <div className="text-xs text-gray-500 p-2 text-center">No folders yet</div>
      )}
      {thread.folderId && (
        <>
          <div className="h-px bg-border my-1" />
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7" onClick={() => handleMove(undefined)}>
            <span>Remove from folder</span>
          </Button>
        </>
      )}
    </div>
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" side="right" align="start">
        {content}
      </PopoverContent>
    </Popover>
  )
}

export function ThreadContextMenu({ thread, children, onRename }: ThreadContextMenuProps) {
  const { deleteThread, togglePin, shareThread, copyShareLink } = useThreads();
  const { states, openDialog, closeDialog } = useMultipleDialogState({
    delete: false,
    tags: false
  });

  const handleDelete = () => {
    deleteThread(thread._id);
  };

  const handleTogglePin = () => {
    togglePin(thread._id);
  };
  
  const handleRenameClick = () => {
    onRename();
  };

  const handleShare = () => {
    shareThread(thread._id);
  };

  const handleCopyLink = () => {
    copyShareLink(thread._id);
  }
  
  const handleOpenTags = () => {
    openDialog('tags');
  }

  const menuContent = (
    <div className="flex flex-col gap-1 text-xs">
      <ContextMenuButton icon={Pin} onClick={handleTogglePin}>
        <span className={cn(thread.pinned && "fill-current")}>
          {thread.pinned ? "Unpin" : "Pin"}
        </span>
      </ContextMenuButton>
      
      <ContextMenuButton icon={Edit} onClick={handleRenameClick}>
        Rename
      </ContextMenuButton>
      
      <MoveToFolderMenu thread={thread}>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7">
          <Folder className="h-3 w-3" />
          <span>Move to</span>
          <ChevronRight className="h-3 w-3 ml-auto" />
        </Button>
      </MoveToFolderMenu>

      <ContextMenuButton icon={Tag} onClick={handleOpenTags}>
        Manage Tags
      </ContextMenuButton>

      <div className="h-px bg-border my-1" />

      {thread.shareInfo?.isShared ? (
        <>
          <ContextMenuButton icon={Copy} onClick={handleCopyLink}>
            Copy Share Link
          </ContextMenuButton>
          <ContextMenuButton 
            icon={RefreshCw} 
            onClick={handleShare}
            className={cn(thread.shareInfo?.isOutOfSync && "text-yellow-500")}
          >
            <span className="flex items-center gap-2">
              Update Shared
              {thread.shareInfo?.isOutOfSync && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
            </span>
          </ContextMenuButton>
        </>
      ) : (
        <ContextMenuButton icon={Share2} onClick={handleShare}>
          Share
        </ContextMenuButton>
      )}

      <ContextMenuButton icon={Trash2} onClick={() => openDialog('delete')} variant="destructive">
        Delete
      </ContextMenuButton>
    </div>
  )

  return (
    <>
      <DeleteConfirmationDialog
        open={states.delete}
        onOpenChange={(open) => !open && closeDialog('delete')}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This will permanently delete the thread"
        itemName={thread.userTitle || thread.title}
      />
      
      <Dialog open={states.tags} onOpenChange={(open) => !open && closeDialog('tags')}>
        <ManageTagsDialog thread={thread} setOpen={(open) => !open && closeDialog('tags')} />
      </Dialog>

      <ContextMenu content={menuContent} contentClassName="w-44 p-1">
        {children}
      </ContextMenu>
    </>
  );
} 