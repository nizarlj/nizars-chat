"use client";

import { useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";
import { type Message } from "ai";
import { useMessageEditor } from "@/hooks/useMessageEditor";
import { AttachmentList, FileInput } from "@/components/Chat/attachments";
import { useChatConfig } from "@/components/Chat/context";
import { getModelById, type SupportedModelId } from "@/lib/models";

interface MessageEditorProps {
  initialContent: string;
  initialMessage: Message;
  originalAttachmentIds: Id<'attachments'>[];
  onSave: (content: string, attachmentIds: Id<'attachments'>[]) => void;
  onCancel: () => void;
  className?: string;
}

export default function MessageEditor({
  initialContent,
  initialMessage,
  originalAttachmentIds,
  onSave,
  onCancel,
  className
}: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedModel } = useChatConfig();
  
  const messageModel = (() => {
    try {
      if ('model' in initialMessage && typeof initialMessage.model === 'string') {
        return getModelById(initialMessage.model as SupportedModelId);
      }
    } catch {
    }
    return selectedModel;
  })();
  
  const {
    content,
    setContent,
    attachments,
    isSaving,
    isUploading,
    hasUploadingAttachments,
    isSubmitDisabled,
    handleFilesSelected,
    handleRemoveAttachment,
    handleSave,
    handleKeyDown,
  } = useMessageEditor({
    initialContent,
    initialMessage,
    originalAttachmentIds,
    onSave,
    onCancel,
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Edit your message..."
        className="min-h-[100px] resize-none"
        disabled={isSaving || isUploading || hasUploadingAttachments}
      />
      
      <AttachmentList
        attachments={attachments}
        onRemove={handleRemoveAttachment}
        disabled={isSaving || isUploading}
        variant="grid"
        isEditMode={true}
      />
      
      <div className="flex items-center justify-between gap-2">
        <FileInput
          onFilesSelected={handleFilesSelected}
          disabled={isSaving || isUploading}
          model={messageModel}
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving || isUploading || hasUploadingAttachments}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSubmitDisabled}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            {isSaving || isUploading || hasUploadingAttachments ? "Saving..." : "Save & Send"}
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
      </div>
    </div>
  );
} 