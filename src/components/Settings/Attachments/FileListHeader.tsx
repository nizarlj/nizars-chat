"use client";

import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SortableAttachmentKeys } from "@/hooks/useAttachmentsManager";
import { useAttachmentsManagerContext } from "@/components/Providers/AttachmentsManagerProvider";

interface FileListHeaderProps {
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
}

const SortableHeader = ({
  title,
  sortKey,
  className,
}: {
  title: string;
  sortKey: SortableAttachmentKeys;
  className?: string;
}) => {
  const { sortConfig, handleSort } = useAttachmentsManagerContext();
  const isActive = sortConfig.key === sortKey;
  const direction = sortConfig.direction;
  
  const getSortIcon = () => {
    if (!isActive) return ArrowUpDown;
    return direction === "asc" ? ArrowUp : ArrowDown;
  };
  
  const SortIcon = getSortIcon();

  return (
    <div className={cn("flex items-center", className)}>
      <Button variant="ghost" onClick={() => handleSort(sortKey)} className="-ml-3 h-8 text-xs">
        {title}
        <SortIcon
          className={cn(
            "ml-1 h-3 w-3",
            isActive
              ? "text-foreground"
              : "text-muted-foreground/50"
          )}
        />
      </Button>
    </div>
  );
};

export const FileListHeader = memo(function FileListHeader({
  isAllSelected,
  isIndeterminate,
  onSelectAll,
}: FileListHeaderProps) {
  return (
    <div className="flex items-center px-4 py-2 bg-muted/50 border-b">
      <Checkbox
        checked={isIndeterminate ? "indeterminate" : isAllSelected}
        onCheckedChange={onSelectAll}
        className="mr-4"
      />
      <div className="flex-1 grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
        <SortableHeader
          title="File Name"
          sortKey="fileName"
          className="col-span-5"
        />
        <SortableHeader
          title="Size"
          sortKey="size"
          className="col-span-2"
        />
        <SortableHeader
          title="Uploaded"
          sortKey="createdAt"
          className="col-span-3"
        />
        <div className="col-span-2 flex items-center justify-end pr-2">Actions</div>
      </div>
    </div>
  );
});

FileListHeader.displayName = "FileListHeader"; 