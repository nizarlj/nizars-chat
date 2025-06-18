"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { 
  type AttachmentWithUpload, 
  type NewAttachment, 
  type ExistingAttachment, 
  type InitialAttachment 
} from "@/types/attachments";

export function useAttachmentUpload(initialAttachments: InitialAttachment[] = []) {
  const [attachments, setAttachments] = useState<AttachmentWithUpload[]>([]);
  const serializedInitialAttachments = JSON.stringify(initialAttachments);

  useEffect(() => {
    const existing: ExistingAttachment[] = initialAttachments.map(doc => ({ 
      ...doc,
      id: doc._id, 
      isExisting: true, 
      isMarkedForRemoval: false 
    }));
    setAttachments(existing);
  }, [initialAttachments, serializedInitialAttachments]);

  const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
  const createAttachment = useMutation(api.attachments.createAttachment);

  const uploadFile = useCallback(
    async (file: File) => {
      const clientUploadId = crypto.randomUUID();
      const newAttachment: NewAttachment = {
        id: clientUploadId,
        file,
        isExisting: false,
        isUploading: true,
        isUploadComplete: false,
        isMarkedForRemoval: false,
      };

      setAttachments(prev => [...prev, newAttachment]);

      try {
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

        setAttachments(prev => prev.map(a => 
          a.id === clientUploadId 
            ? { ...a, isUploading: false, isUploadComplete: true, dbId: attachmentId } as NewAttachment
            : a
        ));

        setTimeout(() => {
          setAttachments(prev => prev.map(a => 
            a.id === clientUploadId 
              ? { ...a, isUploadComplete: false } as NewAttachment
              : a
          ));
        }, 2000);

      } catch (error) {
        console.error("Upload failed", error);
        setAttachments(prev => prev.filter(a => a.id !== clientUploadId));
      }
    },
    [generateUploadUrl, createAttachment],
  );
  
  return { attachments, setAttachments, uploadFile };
} 