"use client";

import { useCallback } from "react";
import { useChatAttachments } from "../context";
import { AttachmentList } from ".";

export default function AttachmentArea() {
  const { attachments, removeAttachment, isUploading } = useChatAttachments();

  const handleRemove = useCallback((index: number) => {
    const attachment = attachments[index];
    if (attachment) {
      removeAttachment(attachment);
    }
  }, [attachments, removeAttachment]);

  return (
    <AttachmentList
      attachments={attachments}
      onRemove={handleRemove}
      disabled={isUploading}
      variant="flex"
      displayBadges={false}
    />
  );
} 