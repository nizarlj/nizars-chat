"use client";

import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';

export interface AttachmentWithUpload {
  id?: Id<'attachments'>;
  file?: File;
  name: string;
  contentType: string;
  url?: string;
  isExisting: boolean;
  isUploading?: boolean;
  isMarkedForRemoval?: boolean;
  isNew?: boolean;
}

export function useAttachmentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createAttachment = useMutation(api.files.createAttachment);

  const uploadAttachment = useCallback(async (file: File): Promise<Id<'attachments'>> => {
    const uploadUrl = await generateUploadUrl();
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await response.json();
    
    const attachmentId = await createAttachment({
      storageId,
      fileName: file.name,
      mimeType: file.type,
    });
    
    return attachmentId;
  }, [generateUploadUrl, createAttachment]);

  const uploadMultipleAttachments = useCallback(async (
    attachments: AttachmentWithUpload[],
    onProgress?: (index: number, isUploading: boolean) => void
  ): Promise<Id<'attachments'>[]> => {
    const newAttachments = attachments.filter(att => !att.isExisting && att.file);
    
    if (newAttachments.length === 0) {
      return [];
    }
    
    setIsUploading(true);
    
    try {
      const uploadPromises = newAttachments.map(async (attachment, index) => {
        onProgress?.(index, true);
        
        try {
          const attachmentId = await uploadAttachment(attachment.file!);
          onProgress?.(index, false);
          return attachmentId;
        } catch (error) {
          onProgress?.(index, false);
          throw error;
        }
      });
      
      return await Promise.all(uploadPromises);
    } finally {
      setIsUploading(false);
    }
  }, [uploadAttachment]);

  return {
    isUploading,
    uploadAttachment,
    uploadMultipleAttachments,
  };
} 