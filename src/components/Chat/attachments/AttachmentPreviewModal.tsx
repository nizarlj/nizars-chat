"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AttachmentPreview, Attachment } from ".";
import { ExternalLinkButton, DownloadButton } from "../shared";
import { TooltipProvider } from "@/components/ui/tooltip";
import React from "react";

interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  onOpenChange: (open: boolean) => void;
  renderHeaderActions?: (attachment: Attachment) => React.ReactNode;
  renderFooter?: (attachment: Attachment) => React.ReactNode;
}

export default function AttachmentPreviewModal({
  attachment,
  onOpenChange,
  renderHeaderActions,
  renderFooter,
}: AttachmentPreviewModalProps) {
  if (!attachment) return null;

  return (
    <Dialog open={!!attachment} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[80vw] sm:max-w-[80vw] lg:max-w-4xl w-full h-[80vh] flex flex-col p-0"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <TooltipProvider>
          <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b">
            <DialogTitle className="truncate text-lg font-semibold">
              {attachment.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {renderHeaderActions
                ? renderHeaderActions(attachment)
                : (
                  <>
                    {attachment.url && (
                      <ExternalLinkButton url={attachment.url} />
                    )}
                    {attachment.url && (
                      <DownloadButton
                        url={attachment.url}
                        filename={attachment.name || "file.txt"}
                      />
                    )}
                  </>
                )}
              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <AttachmentPreview attachment={attachment} fullPreview={true} />
          </div>
          {renderFooter && (
            <div className="px-6 pb-4 pt-2 border-t">
              {renderFooter(attachment)}
            </div>
          )}
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
} 