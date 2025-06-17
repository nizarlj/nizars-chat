"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAttachmentsManagerContext } from "@/components/Providers/AttachmentsManagerProvider";
import { FileListHeader } from "./FileListHeader";
import { AttachmentFilters } from "./AttachmentFilters";
import { AttachmentStorageStats } from "./AttachmentStorageStats";
import { AttachmentFileListContent } from "./AttachmentFileListContent";
import AttachmentPreviewModal from "@/components/Chat/attachments/AttachmentPreviewModal";
import { type Attachment } from "@/components/Chat/attachments";

export function AttachmentsTab() {
  const {
    attachments,
    isLoading,
    filteredAttachments,
    totalSize,
    searchQuery,
    selectedAttachments,
    handleSelectAll,
    fileTypeFilter,
    dateFilter,
  } = useAttachmentsManagerContext();

  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );

  const totalFiles = attachments?.length || 0;
  const hasActiveFilters = Boolean(
    searchQuery || 
    fileTypeFilter !== "all" || 
    dateFilter
  );

  return (
    <div className="space-y-6">
      <AttachmentStorageStats 
        totalFiles={totalFiles}
        totalSize={totalSize}
        isLoading={isLoading}
      />

      <AttachmentFilters />

      <Card className="gap-0 p-0 overflow-hidden">
        <FileListHeader
          isAllSelected={
            selectedAttachments.size > 0 &&
            selectedAttachments.size === filteredAttachments.length
          }
          isIndeterminate={
            selectedAttachments.size > 0 &&
            selectedAttachments.size < filteredAttachments.length
          }
          onSelectAll={handleSelectAll}
        />
        <CardContent className="p-0">
          <AttachmentFileListContent
            onPreview={setPreviewAttachment}
            hasFilters={hasActiveFilters}
          />
        </CardContent>
      </Card>

      <AttachmentPreviewModal
        attachment={previewAttachment}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPreviewAttachment(null);
        }}
      />
    </div>
  );
} 