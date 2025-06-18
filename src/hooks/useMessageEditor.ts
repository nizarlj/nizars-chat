"use client";

import { useState, useCallback, useMemo } from 'react';
import { type Message } from 'ai';
import { Id } from '@convex/_generated/dataModel';
import { useAttachmentUpload } from './useAttachmentUpload';
import { type AttachmentWithUpload, type ExistingAttachment, type NewAttachment, type AttachmentData } from '@/types/attachments';
import { isEqual } from 'lodash';

interface UseMessageEditorOptions {
  initialContent: string;
  initialMessage: Message;
  originalAttachmentIds: Id<'attachments'>[];
  onSave: (
    content: string, 
    attachmentIds: Id<'attachments'>[],
    attachmentData?: AttachmentData[]
  ) => void;
  onCancel: () => void;
}

export function useMessageEditor({
  initialContent,
  initialMessage,
  originalAttachmentIds,
  onSave,
  onCancel,
}: UseMessageEditorOptions) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const initialAttachments = useMemo(() => initialMessage.experimental_attachments?.map((att, i) => ({
    _id: originalAttachmentIds[i],
    fileName: att.name || 'attachment',
    mimeType: att.contentType || 'application/octet-stream',
  })) || [], [initialMessage.experimental_attachments, originalAttachmentIds]);

  const { attachments, setAttachments, uploadFile } = useAttachmentUpload(initialAttachments);

  const handleFilesSelected = useCallback((files: File[]) => {
    files.forEach(uploadFile);
  }, [uploadFile]);

  const handleRemoveAttachment = useCallback((_index: number) => {
    const attachment = attachments[_index];
    if (attachment.isExisting) {
      setAttachments(prev => prev.map((att, i) => 
        i === _index ? { ...att, isMarkedForRemoval: !att.isMarkedForRemoval } : att
      ) as AttachmentWithUpload[]);
    } else {
      setAttachments(prev => prev.filter((_, i) => i !== _index));
    }
  }, [attachments, setAttachments]);

  const handleSave = useCallback(async () => {
    if (attachments.some(a => !a.isExisting && a.isUploading)) {
      return;
    }
    
    if (!content.trim() && attachments.filter(a => !(a as ExistingAttachment).isMarkedForRemoval).length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      const existingToKeep = attachments
        .filter((a): a is ExistingAttachment => a.isExisting && !a.isMarkedForRemoval);
      
      const newUploaded = attachments
        .filter((a): a is NewAttachment => !a.isExisting && !!a.dbId);
      
      const finalAttachmentIds = [
        ...existingToKeep.map(a => a.id),
        ...newUploaded.map(a => a.dbId!),
      ];

      // Collect rich attachment data for immediate preview
      const attachmentData: AttachmentData[] = [
        ...existingToKeep.map((a) => {
          // Find the corresponding original attachment to preserve the URL
          const originalIndex = originalAttachmentIds.findIndex(id => id === a.id);
          const originalAttachment = originalIndex !== -1 ? initialMessage.experimental_attachments?.[originalIndex] : null;
          
          return {
            id: a.id,
            fileName: a.fileName,
            mimeType: a.mimeType,
            url: originalAttachment?.url, // Preserve original URL
          };
        }),
        ...newUploaded.map(a => ({
          id: a.dbId!,
          fileName: a.file.name,
          mimeType: a.file.type,
          file: a.file, // Include file for immediate blob URL
        })),
      ];
      
      onSave(content.trim(), finalAttachmentIds, attachmentData);
      onCancel();
    } catch (error) {
      console.error("Failed to save message:", error);
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave, attachments, onCancel, originalAttachmentIds, initialMessage.experimental_attachments]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [handleSave, onCancel]);

  const hasContentChanged = content !== initialContent;
  
  const initialAttachmentSet = new Set(originalAttachmentIds);
  const currentAttachmentSet = new Set(
    attachments
      .filter((a): a is ExistingAttachment => a.isExisting && !a.isMarkedForRemoval)
      .map(a => a.id)
  );
  const hasAttachmentsChanged = !isEqual(initialAttachmentSet, currentAttachmentSet) || 
                                attachments.some(a => !a.isExisting);

  const isSubmitDisabled = 
    (!hasContentChanged && !hasAttachmentsChanged) ||
    (content.trim().length === 0 && attachments.filter(a => !(a as ExistingAttachment).isMarkedForRemoval).length === 0) ||
    attachments.some(a => !a.isExisting && a.isUploading);

  return {
    content,
    setContent,
    attachments,
    isSaving,
    isSubmitDisabled,
    handleFilesSelected,
    handleRemoveAttachment,
    handleSave,
    handleKeyDown,
  };
} 