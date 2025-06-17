"use client";

import { Files } from "lucide-react";

export function AttachmentFileListLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center">
          <Files className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">Loading attachments...</p>
        <p className="text-xs text-muted-foreground">Please wait while we fetch your files</p>
      </div>
    </div>
  );
} 