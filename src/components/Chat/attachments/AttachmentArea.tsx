"use client";

import { useChatAttachments } from "../context";
import { Button } from "@/components/ui/button";
import { File as FileIcon, XIcon, Loader2 } from "lucide-react";

export default function AttachmentArea() {
  const { attachments, removeAttachment, isUploading } = useChatAttachments();

  if(attachments.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {attachments.length > 0 && (
        <div className="w-full flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md text-sm">
              <FileIcon className="w-4 h-4" />
              <span>{attachment.file.name}</span>
              {attachment.isUploading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeAttachment(index)}
                disabled={isUploading || attachment.isUploading}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 