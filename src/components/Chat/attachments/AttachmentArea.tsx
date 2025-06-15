"use client";

import { useChatAttachments } from "../context";
import { AttachmentList } from ".";

export default function AttachmentArea() {
  const { attachments, removeAttachment, isUploading } = useChatAttachments();

  return (
    <AttachmentList
      attachments={attachments}
      onRemove={removeAttachment}
      disabled={isUploading}
      variant="flex"
    />
  );
} 