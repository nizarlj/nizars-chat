"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Trash2, Eye } from "lucide-react";
import { getFileTypeIcon, formatFileSize, getFileType } from "@/lib/fileUtils";
import { type Id } from "@convex/_generated/dataModel";
import { type useAttachmentsManager } from "@/hooks/useAttachmentsManager";
import { DeleteConfirmationDialog } from "@/components/ui/ConfirmationDialog";

type AttachmentWithUpload = NonNullable<
  ReturnType<typeof useAttachmentsManager>["attachments"]
>[number];

interface FileListItemProps {
  attachment: AttachmentWithUpload;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: Id<"attachments">) => void;
  onPreview: (attachment: AttachmentWithUpload) => void;
}

export const FileListItem = memo(function FileListItem({
  attachment,
  isSelected,
  onSelect,
  onDelete,
  onPreview,
}: FileListItemProps) {
  const FileIcon = getFileTypeIcon(attachment.fileName, attachment.mimeType);

  return (
    <div className="flex items-center px-4 py-2 border-b last:border-b-0 hover:bg-muted/50">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(attachment._id)}
        className="mr-4"
      />
      <div className="flex-1 grid grid-cols-12 gap-2 items-center">
        <div className="col-span-5 flex items-center gap-3">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span
              className="font-medium truncate cursor-pointer hover:underline text-sm"
              onClick={() => onPreview(attachment)}
            >
              {attachment.fileName}
            </span>
            <span className="text-xs text-muted-foreground">
              {getFileType(attachment.mimeType)}
            </span>
          </div>
        </div>
        <div className="col-span-2 text-sm text-muted-foreground">
          {formatFileSize(attachment.size)}
        </div>
        <div className="col-span-3 text-sm text-muted-foreground">
          {new Date(attachment.createdAt).toLocaleDateString()}
        </div>
        <div className="col-span-2 flex justify-end items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPreview(attachment)}
            tooltip="Preview"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild tooltip="Download">
            <a
              href={attachment.url || ""}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </Button>
          <DeleteConfirmationDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                tooltip="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
            title="Delete Attachment"
            description="Are you sure you want to delete?"
            itemName={attachment.fileName}
            onConfirm={() => onDelete(attachment._id)}
          />
        </div>
      </div>
    </div>
  );
});

FileListItem.displayName = "FileListItem"; 