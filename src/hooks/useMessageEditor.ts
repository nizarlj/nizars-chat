"use client";

import { useState, useCallback, useEffect } from 'react';
import { type Message } from 'ai';
import { Id } from '@convex/_generated/dataModel';
import { useAttachmentUpload, type AttachmentWithUpload } from './useAttachmentUpload';

interface UseMessageEditorOptions {
  initialContent: string;
  initialMessage: Message;
  originalAttachmentIds: Id<'attachments'>[];
  onSave: (content: string, attachmentIds: Id<'attachments'>[]) => void;
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
  const [attachments, setAttachments] = useState<AttachmentWithUpload[]>([]);
  
  const { isUploading, uploadMultipleAttachments } = useAttachmentUpload();

  useEffect(() => {
    if (initialMessage.experimental_attachments) {
      const existingAttachments: AttachmentWithUpload[] = initialMessage.experimental_attachments.map((att, index) => ({
        id: originalAttachmentIds[index],
        name: att.name || 'attachment',
        contentType: att.contentType || 'application/octet-stream',
        url: att.url,
        isExisting: true,
        isMarkedForRemoval: false,
      }));
      setAttachments(existingAttachments);
    }
  }, [initialMessage, originalAttachmentIds]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newAttachments: AttachmentWithUpload[] = files.map(file => ({
      file,
      name: file.name,
      contentType: file.type,
      isExisting: false,
      isNew: true,
      isMarkedForRemoval: false,
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.map((att, i) => {
      if (i === index) {
        if (att.isExisting) {
          return { ...att, isMarkedForRemoval: !att.isMarkedForRemoval };
        } else {
          return null;
        }
      }
      return att;
    }).filter(Boolean) as AttachmentWithUpload[]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const attachmentsToKeep = attachments.filter(att => !att.isMarkedForRemoval);
      const newAttachmentsToUpload = attachmentsToKeep.filter(att => !att.isExisting);
      
      const onProgress = (index: number, uploading: boolean) => {
        setAttachments(prev => prev.map((att) => {
          if (!att.isExisting && att.file) {
            const newAttachmentIndex = newAttachmentsToUpload.indexOf(att);
            if (newAttachmentIndex === index) {
              return { ...att, isUploading: uploading };
            }
          }
          return att;
        }));
      };

      const newAttachmentIds = await uploadMultipleAttachments(newAttachmentsToUpload, onProgress);
      
      const remainingExistingIds = attachmentsToKeep
        .filter(att => att.isExisting && att.id)
        .map(att => att.id!);
      
      const finalAttachmentIds = [...remainingExistingIds, ...newAttachmentIds];
      
      await onSave(content.trim(), finalAttachmentIds);
    } catch (error) {
      console.error("Failed to save message:", error);
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave, uploadMultipleAttachments, attachments]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [handleSave, onCancel]);

  const hasUploadingAttachments = attachments.some(att => att.isUploading);
  const isSubmitDisabled = !content.trim() || isSaving || isUploading || hasUploadingAttachments;

  return {
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
  };
} 