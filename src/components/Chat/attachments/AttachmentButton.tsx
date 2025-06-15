"use client";

import { useChatAttachments } from "../context";
import { useChatConfig } from "../context";
import { FileInput } from ".";

interface AttachmentButtonProps {
  disabled?: boolean;
}

export default function AttachmentButton({ disabled }: AttachmentButtonProps) {
  const { addAttachments, isUploading } = useChatAttachments();
  const { selectedModel } = useChatConfig();

  return (
    <FileInput
      onFilesSelected={addAttachments}
      disabled={disabled || isUploading}
      model={selectedModel}
    />
  );
} 