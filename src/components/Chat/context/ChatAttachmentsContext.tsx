"use client";

import { createContext, useContext, useCallback } from 'react';
import { Id } from '@convex/_generated/dataModel';
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload';
import { type AttachmentWithUpload, type NewAttachment, type AttachmentData } from '@/types/attachments';

interface ChatAttachmentsContextType {
  attachments: AttachmentWithUpload[];
  addAttachments: (files: File[]) => void;
  removeAttachment: (attachment: AttachmentWithUpload) => void;
  clearAttachments: () => void;
  isUploading: boolean;
  uploadAttachments: () => Promise<Id<'attachments'>[]>;
  getAttachmentData: () => AttachmentData[]; // For optimistic rendering
}

const ChatAttachmentsContext = createContext<ChatAttachmentsContextType | undefined>(undefined);

export function ChatAttachmentsProvider({ children }: { children: React.ReactNode }) {
  const { attachments, setAttachments, uploadFile } = useAttachmentUpload();

  const addAttachments = useCallback((files: File[]) => {
    files.forEach(uploadFile);
  }, [uploadFile]);

  const removeAttachment = useCallback((attachmentToRemove: AttachmentWithUpload) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentToRemove.id));
  }, [setAttachments]);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, [setAttachments]);

  const uploadAttachments = useCallback(async (): Promise<Id<'attachments'>[]> => {
    const newAttachments = attachments.filter((att): att is NewAttachment => !att.isExisting);
    if (newAttachments.length === 0) return [];
    
    // Every new attachment should have a dbId because the submit button is disabled during upload.
    const attachmentIds = newAttachments
      .map(att => att.dbId)
      .filter((id): id is Id<'attachments'> => id !== undefined);

    clearAttachments();

    return attachmentIds;
  }, [attachments, clearAttachments]);

  const getAttachmentData = useCallback((): AttachmentData[] => {
    return attachments.map(att => {
      if (att.isExisting) {
        return {
          id: att.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          // No URL or file for existing attachments - will be loaded from Convex
        };
      } else {
        return {
          id: att.dbId!,
          fileName: att.file.name,
          mimeType: att.file.type,
          file: att.file, // Include file for immediate blob URL creation
        };
      }
    }).filter(data => data.id !== undefined); // Only include attachments with valid IDs
  }, [attachments]);
  
  const isUploading = attachments.some(att => !att.isExisting && att.isUploading);

  const value = {
    attachments,
    addAttachments,
    removeAttachment,
    clearAttachments,
    isUploading,
    uploadAttachments,
    getAttachmentData,
  };

  return (
    <ChatAttachmentsContext.Provider value={value}>
      {children}
    </ChatAttachmentsContext.Provider>
  );
}

export const useChatAttachments = () => {
  const context = useContext(ChatAttachmentsContext);
  if (context === undefined) {
    throw new Error('useChatAttachments must be used within a ChatAttachmentsProvider');
  }
  return context;
}; 