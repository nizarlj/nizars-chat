"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';

interface AttachmentWithId {
  file: File;
  id?: Id<'attachments'>;
  isUploading?: boolean;
}

interface ChatAttachments {
  attachments: AttachmentWithId[];
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
  const [attachments, setAttachments] = useState<AttachmentWithId[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentAttachmentIds, setCurrentAttachmentIds] = useState<Id<'attachments'>[]>([]);
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createAttachment = useMutation(api.files.createAttachment);

  const addAttachments = useCallback((files: File[]) => {
    const newAttachments = files.map(file => ({ file }));
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
    
    setIsUploading(true);
    
    try {
      const attachmentIds = await Promise.all(
        attachments.map(async (attachment, index) => {
          if (attachment.id) {
            return attachment.id;
          }
          
          setAttachments(prev => prev.map((att, i) => 
            i === index ? { ...att, isUploading: true } : att
          ));
          
          const uploadUrl = await generateUploadUrl();
          
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": attachment.file.type },
            body: attachment.file,
          });
          const { storageId } = await response.json();
          
          const attachmentId = await createAttachment({
            storageId,
            fileName: attachment.file.name,
            mimeType: attachment.file.type,
          });
          
          setAttachments(prev => prev.map((att, i) => 
            i === index ? { ...att, id: attachmentId, isUploading: false } : att
          ));
          
          return attachmentId;
        })
      );
      
      return attachmentIds;
    } catch (error) {
      console.error('[ChatAttachments] uploadAttachments - error:', error);
      setAttachments(prev => prev.map(att => ({ ...att, isUploading: false })));
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [attachments, generateUploadUrl, createAttachment]);

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