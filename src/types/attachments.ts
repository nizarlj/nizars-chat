import { Id } from '@convex/_generated/dataModel';

// Base attachment data from Convex
export interface ConvexAttachment {
  _id: Id<'attachments'>;
  fileName: string;
  mimeType: string;
  url: string;
}

// Rich attachment data for optimistic rendering
export interface AttachmentData {
  id: Id<'attachments'>;
  fileName: string;
  mimeType: string;
  url?: string;
  file?: File; // For new uploads that need immediate blob URL preview
}

// Initial attachment from Convex (no URL yet)
export interface InitialAttachment {
  _id: Id<'attachments'>;
  fileName: string;
  mimeType: string;
}

// Existing attachment in upload context
export interface ExistingAttachment extends InitialAttachment {
  id: Id<'attachments'>;
  isExisting: true;
  isMarkedForRemoval?: boolean;
}

// New attachment being uploaded
export interface NewAttachment {
  id: string; // Client-side ID
  dbId?: Id<'attachments'>;
  file: File;
  isExisting: false;
  isUploading: boolean;
  isUploadComplete: boolean;
  isMarkedForRemoval?: boolean;
}

// Union type for attachments in upload context
export type AttachmentWithUpload = ExistingAttachment | NewAttachment; 