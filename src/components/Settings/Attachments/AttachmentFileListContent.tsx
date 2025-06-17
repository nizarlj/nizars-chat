"use client";

import { cn, scrollbarStyle } from "@/lib/utils";
import { type Id } from "@convex/_generated/dataModel";
import { FileListItem } from "./FileListItem";
import { AttachmentFileListLoading } from "./AttachmentFileListLoading";
import { AttachmentEmptyState } from "./AttachmentEmptyState";
import { useAttachmentsManagerContext } from "@/components/Providers/AttachmentsManagerProvider";
import { Attachment } from "@/components/Chat/attachments";

interface AttachmentFileListContentProps {
  onPreview: (attachment: Attachment) => void;
  hasFilters: boolean;
}

export function AttachmentFileListContent({
  onPreview,
  hasFilters,
}: AttachmentFileListContentProps) {
  const {
    filteredAttachments,
    selectedAttachments,
    handleSelectAttachment,
    handleDeleteSingle,
    isLoading,
  } = useAttachmentsManagerContext();

  if (isLoading) {
    return <AttachmentFileListLoading />;
  }

  if (filteredAttachments.length === 0) {
    return <AttachmentEmptyState hasFilters={hasFilters} />;
  }

  const handleDelete = (id: Id<"attachments">) => {
    handleDeleteSingle(id).catch(console.error);
  };

  return (
    <div className={cn("max-h-[600px] overflow-y-auto", scrollbarStyle)}>
      {filteredAttachments.map((attachment) => (
        <FileListItem
          key={attachment._id}
          attachment={attachment}
          isSelected={selectedAttachments.has(attachment._id)}
          onSelect={handleSelectAttachment}
          onDelete={handleDelete}
          onPreview={(att) =>
            onPreview({
              name: att.fileName,
              contentType: att.mimeType,
              url: att.url || "",
            })
          }
        />
      ))}
    </div>
  );
} 