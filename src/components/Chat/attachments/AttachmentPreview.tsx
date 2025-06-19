"use client";

import React from "react";
import Image from "next/image";
import { PdfPreview, TextFilePreview, Attachment } from ".";
import { cn, scrollbarStyle } from "@/lib/utils";
import { ExternalLinkButton, DownloadButton } from "../shared";
import { Loader2 } from "lucide-react";

interface AttachmentPreviewProps {
  attachment: Attachment;
  className?: string;
  fullPreview?: boolean;
}

export default function AttachmentPreview({ attachment, className = "", fullPreview = false }: AttachmentPreviewProps) {
  const contentType = attachment.contentType || "";
  const hasUrl = attachment.url && attachment.url.length > 0;

  // Extract file extension for language
  let extension = "";
  if (attachment.name) {
    const match = attachment.name.match(/\.([a-zA-Z0-9]+)$/);
    if (match) extension = match[1];
  }

  // If no URL, show loading state
  if (!hasUrl) {
    return (
      <div className={cn(
        "w-full flex flex-col rounded-md",
        fullPreview ? "h-full" : "h-60",
        className
      )}>
        <div className="flex items-center justify-between px-3 py-1 bg-card rounded-t-md w-full">
          <span className="truncate font-medium text-sm" title={attachment.name}>{attachment.name}</span>
          <div className="flex items-center gap-1">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </div>
        <div className={cn(
          "w-full flex-1 flex items-center justify-center",
          fullPreview ? "overflow-auto p-6" : "bg-card/50 overflow-hidden p-3",
          scrollbarStyle
        )}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading preview...</span>
          </div>
        </div>
      </div>
    );
  }

  let previewContent;
  if (contentType.startsWith("image/")) {
    previewContent = (
      <Image
        src={attachment.url!}
        alt={attachment.name!}
        width={400}
        height={400}
        className="rounded-md object-contain h-full w-full"
      />
    );
  } else if (contentType === "application/pdf") {
    previewContent = <PdfPreview url={attachment.url!} />;
  } else if (contentType.startsWith("text/")) {
    previewContent = (
      <TextFilePreview 
        url={attachment.url!} 
        filename={attachment.name || "file.txt"}
        fullPreview={fullPreview} 
        language={extension}
        showCodeHeader={!!fullPreview}
      />
    );
  } else {
    // Fallback: just a link
    previewContent = (
      <a
        href={attachment.url!}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 bg-background rounded-md"
      >
        <span className="truncate">{attachment.name}</span>
      </a>
    );
  }

  return (
    <div className={cn(
      "w-full flex flex-col rounded-md",
      fullPreview ? "h-full" : "h-60",
      className
    )}>
      {!fullPreview && (
        <div className="flex items-center justify-between px-3 py-1 bg-card rounded-t-md w-full">
          <span className="truncate font-medium text-sm" title={attachment.name}>{attachment.name}</span>
          <div className="flex items-center gap-1">
            {attachment.url && (
              <ExternalLinkButton url={attachment.url} />
            )}
            {attachment.url && (
              <DownloadButton url={attachment.url} filename={attachment.name || "file.txt"} />
            )}
          </div>
        </div>
      )}
      <div className={cn(
        "w-full flex-1",
        fullPreview ? "overflow-auto p-6" : "bg-card/50 overflow-hidden p-3",
        scrollbarStyle
      )}>
        {previewContent}
      </div>
    </div>
  );
} 