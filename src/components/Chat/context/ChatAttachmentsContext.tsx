"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import { Id } from '@convex/_generated/dataModel';
import { useAttachmentUpload, type AttachmentWithUpload } from '@/hooks/useAttachmentUpload';

interface ChatAttachments {
  attachments: AttachmentWithUpload[];
  addAttachments: (files: File[]) => void;
  removeAttachment: (index: number) => void;
  clearAttachments: () => void;
  isUploading: boolean;
  uploadAttachments: () => Promise<Id<'attachments'>[]>;
  currentAttachmentIds: Id<'attachments'>[];
  setCurrentAttachmentIds: (ids: Id<'attachments'>[]) => void;
  clearCurrentAttachmentIds: () => void;
}

const ChatAttachmentsContext = createContext<ChatAttachments | undefined>(undefined);

export function ChatAttachmentsProvider({ children }: { children: React.ReactNode }) {
  const [attachments, setAttachments] = useState<AttachmentWithUpload[]>([]);
  const [currentAttachmentIds, setCurrentAttachmentIds] = useState<Id<'attachments'>[]>([]);
  
  const { isUploading, uploadMultipleAttachments } = useAttachmentUpload();

  const addAttachments = useCallback((files: File[]) => {
    const newAttachments: AttachmentWithUpload[] = files.map(file => ({
      file,
      name: file.name,
      contentType: file.type,
      isExisting: false
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const clearCurrentAttachmentIds = useCallback(() => {
    setCurrentAttachmentIds([]);
  }, []);

  const uploadAttachments = useCallback(async (): Promise<Id<'attachments'>[]> => {
    if (attachments.length === 0) {
      return [];
    }
    
    try {
      const onProgress = (index: number, uploading: boolean) => {
        setAttachments(prev => prev.map((att) => {
          if (!att.isExisting && att.file) {
            const newAttachmentIndex = prev.filter(a => !a.isExisting).indexOf(att);
            if (newAttachmentIndex === index) {
              return { ...att, isUploading: uploading };
            }
          }
          return att;
        }));
      };

      const attachmentIds = await uploadMultipleAttachments(attachments, onProgress);
      
      setAttachments(prev => prev.map((att, index) => ({
        ...att,
        id: attachmentIds[index],
        isUploading: false
      })));
      
      return attachmentIds;
    } catch (error) {
      console.error('[ChatAttachments] uploadAttachments - error:', error);
      setAttachments(prev => prev.map(att => ({ ...att, isUploading: false })));
      throw error;
    }
  }, [attachments, uploadMultipleAttachments]);

  const value = {
    attachments,
    addAttachments,
    removeAttachment,
    clearAttachments,
    isUploading,
    uploadAttachments,
    currentAttachmentIds,
    setCurrentAttachmentIds,
    clearCurrentAttachmentIds,
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