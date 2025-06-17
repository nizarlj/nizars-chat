"use client";

import { Files } from "lucide-react";

interface AttachmentEmptyStateProps {
  hasFilters: boolean;
}

export function AttachmentEmptyState({ hasFilters }: AttachmentEmptyStateProps) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 mx-auto bg-muted-foreground/10 rounded-full flex items-center justify-center">
        <Files className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          {hasFilters ? "No files match your filters" : "No attachments found"}
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {hasFilters 
            ? "Try adjusting your search criteria or clearing the filters to see more files."
            : "Start uploading files in your conversations to see them here."
          }
        </p>
      </div>
    </div>
  );
} 