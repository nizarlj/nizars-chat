"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { getFileType } from "@/lib/fileUtils";
import { type DateRange } from "react-day-picker";
import { type Id } from "@convex/_generated/dataModel";

export type SortableAttachmentKeys = "fileName" | "size" | "createdAt";

export interface FileTypeInfo {
  displayName: string;
  mimeType: string;
  count: number;
}

const typeOrder = [
  "Image",
  "Text",
  "PDF", 
  "Code",
  "Spreadsheet",
  "Archive",
  "Video",
  "Audio",
  "Presentation",
  "Database",
  "Font",
  "Other"
];

export function useAttachmentsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set());
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
  const [sortConfig, setSortConfig] = useState<{
    key: SortableAttachmentKeys;
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });

  const attachments = useQuery(api.attachments.getUserAttachments);
  const deleteAttachment = useMutation(api.attachments.deleteAttachment);
  const deleteMultipleAttachments = useMutation(api.attachments.deleteMultipleAttachments);

  const filteredAttachments = useMemo(() => {
    const filtered = attachments?.filter((attachment) => {
      const matchesSearch = attachment.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = fileTypeFilter === 'all' || getFileType(attachment.mimeType) === fileTypeFilter;
      const matchesDate = !dateFilter || (
        attachment.createdAt >= (dateFilter.from?.getTime() || 0) &&
        attachment.createdAt <= (dateFilter.to?.getTime() || Date.now())
      );
      return matchesSearch && matchesType && matchesDate;
    }) || [];

    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [attachments, searchQuery, fileTypeFilter, dateFilter, sortConfig]);

  const fileTypes = useMemo(() => {
    if (!attachments) return [];
    const typeMap = new Map<string, { mimeType: string; count: number }>();
    
    attachments.forEach((attachment) => {
      const fileType = getFileType(attachment.mimeType);
      const existing = typeMap.get(fileType);
      
      if (existing) {
        existing.count++;
      } else {
        typeMap.set(fileType, {
          mimeType: attachment.mimeType,
          count: 1
        });
      }
    });

    

    const orderedTypes: FileTypeInfo[] = [];
    typeOrder.forEach(typeName => {
      const typeData = typeMap.get(typeName);
      if (typeData) {
        orderedTypes.push({
          displayName: typeName,
          mimeType: typeData.mimeType,
          count: typeData.count
        });
        typeMap.delete(typeName);
      }
    });

    Array.from(typeMap.entries()).forEach(([displayName, { mimeType, count }]) => {
      orderedTypes.push({
        displayName,
        mimeType,
        count
      });
    });

    return orderedTypes;
  }, [attachments]);

  const totalSize = useMemo(() => {
    return attachments?.reduce((total, attachment) => total + (attachment.size || 0), 0) || 0;
  }, [attachments]);

  const handleSelectAll = () => {
    if (selectedAttachments.size === filteredAttachments.length) {
      setSelectedAttachments(new Set());
    } else {
      setSelectedAttachments(new Set(filteredAttachments.map(a => a._id)));
    }
  };

  const handleSelectAttachment = (id: string) => {
    const newSelected = new Set(selectedAttachments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAttachments(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedAttachments.size === 0) return;
    
    try {
      await deleteMultipleAttachments({ attachmentIds: Array.from(selectedAttachments) as Id<"attachments">[] });
      setSelectedAttachments(new Set());
    } catch (error) {
      console.error('Error deleting attachments:', error);
    }
  };

  const handleDeleteSingle = async (id: Id<"attachments">) => {
    try {
      await deleteAttachment({ attachmentId: id });
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };
  
  const resetFilters = () => {
    setDateFilter(undefined);
    setFileTypeFilter('all');
  };

  const handleSort = (key: SortableAttachmentKeys) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const hasActiveFilters = Boolean(
    searchQuery || 
    fileTypeFilter !== "all" || 
    dateFilter
  );

  return {
    attachments,
    isLoading: attachments === undefined,
    filteredAttachments,
    fileTypes,
    totalSize,
    searchQuery,
    setSearchQuery,
    selectedAttachments,
    handleSelectAll,
    handleSelectAttachment,
    handleDeleteSelected,
    handleDeleteSingle,
    fileTypeFilter,
    setFileTypeFilter,
    dateFilter,
    setDateFilter,
    resetFilters,
    sortConfig,
    handleSort,
    hasActiveFilters,
  };
} 