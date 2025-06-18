"use client";

import { Button } from "@/components/ui/button";
import { X, Loader2, Undo2, Check } from "lucide-react";
import { cn, scrollbarStyle } from "@/lib/utils";
import { getFileTypeIcon } from "@/lib/fileUtils";
import { Badge } from "@/components/ui/badge";
import { type AttachmentWithUpload } from "@/types/attachments";

interface AttachmentListProps {
  attachments: AttachmentWithUpload[];
  onRemove: (index: number) => void;
  disabled?: boolean;
  className?: string;
  variant?: "grid" | "flex";
  isEditMode?: boolean;
  displayBadges?: boolean;
}

export default function AttachmentList({
  attachments,
  onRemove,
  disabled = false,
  className = "",
  variant = "grid",
  isEditMode = false,
  displayBadges = true
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="text-sm font-medium text-muted-foreground">Attachments</div>
      <div 
        className={cn(
          "w-full overflow-y-auto max-h-72",
          scrollbarStyle,
          "scrollbar-thumb-muted-foreground",
          variant === "grid" ? "grid grid-cols-1 gap-2" : "flex flex-wrap gap-2"
        )}
      >
        {attachments.map((attachment, index) => {
          const name = attachment.isExisting ? attachment.fileName : attachment.file.name;
          const contentType = attachment.isExisting ? attachment.mimeType : attachment.file.type;
          const FileTypeIcon = getFileTypeIcon(name, contentType);
          const isMarkedForRemoval = attachment.isMarkedForRemoval;
          
          return (
            <div 
              key={index} 
              className={cn(
                "flex items-center gap-2 bg-muted p-2 rounded-md text-sm transition-all",
                variant === "flex" && "flex-shrink-0",
                isMarkedForRemoval && "opacity-60"
              )}
            >
              <FileTypeIcon className={cn(
                "w-4 h-4 flex-shrink-0",
                isMarkedForRemoval && "text-muted-foreground"
              )} />
              <span className={cn(
                "flex-1 truncate min-w-0",
                isMarkedForRemoval && "line-through text-muted-foreground"
              )}>
                {name}
              </span>

              {
                displayBadges && (
                  <Badge
                    style="soft"
                    color={attachment.isExisting ? 
                      (isMarkedForRemoval ? "destructive" : "primary") :
                      "success"
                    }
                  >
                    {
                      attachment.isExisting ? 
                        (isMarkedForRemoval ? "Removed" : "Existing") :
                      "New"
                    }
                  </Badge>
                  
                      
                )
              }

              {"isUploading" in attachment && attachment.isUploading && (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              )}
              {"isUploadComplete" in attachment && attachment.isUploadComplete && (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onRemove(index)}
                disabled={disabled || ("isUploading" in attachment && attachment.isUploading)}
                title={isEditMode ? (isMarkedForRemoval ? "Restore attachment" : "Mark for removal") : "Remove attachment"}
              >
                {isEditMode && isMarkedForRemoval ? (
                  <Undo2 className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
} 