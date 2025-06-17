"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { getFileTypeIcon } from "@/lib/fileUtils";
import { useAttachmentsManagerContext } from "@/components/Providers/AttachmentsManagerProvider";

export const AttachmentFilters = memo(function AttachmentFilters() {
  const {
    searchQuery,
    setSearchQuery,
    fileTypeFilter,
    setFileTypeFilter,
    fileTypes,
    dateFilter,
    setDateFilter,
    resetFilters,
    selectedAttachments,
    handleDeleteSelected,
  } = useAttachmentsManagerContext();

  const selectedCount = selectedAttachments.size;
  const anySelected = selectedCount > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between h-8">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Filter Attachments</p>
            {anySelected && <Badge style="outline" color="info">{selectedCount} selected</Badge>}
          </div>
          {anySelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between">
              {fileTypeFilter === "all" ? (
                "All File Types"
              ) : (
                <div className="flex items-center space-x-2">
                  {(() => {
                    const selectedType = fileTypes.find(t => t.displayName === fileTypeFilter);
                    if (selectedType) {
                      const IconComponent = getFileTypeIcon("", selectedType.mimeType);
                      return <IconComponent className="h-4 w-4 text-muted-foreground" />;
                    }
                    return null;
                  })()}
                  <span>{fileTypeFilter}</span>
                </div>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="p-1">
              <div
                className="px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent flex items-center space-x-2"
                onClick={() => setFileTypeFilter("all")}
              >
                <span>All File Types</span>
              </div>
              {fileTypes.map((typeInfo) => {
                const IconComponent = getFileTypeIcon("", typeInfo.mimeType);
                return (
                  <div
                    key={typeInfo.displayName}
                    className="px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent flex items-center justify-between"
                    onClick={() => setFileTypeFilter(typeInfo.displayName)}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <span>{typeInfo.displayName}</span>
                    </div>
                    <Badge style="outline" color="default" className="text-xs font-mono">
                      {typeInfo.count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal col-span-2",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter?.from ? (
                dateFilter.to ? (
                  <>
                    {format(dateFilter.from, "LLL dd, y")} -{" "}
                    {format(dateFilter.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateFilter.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              autoFocus
              mode="range"
              defaultMonth={dateFilter?.from}
              selected={dateFilter}
              onSelect={setDateFilter}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {(dateFilter || fileTypeFilter !== "all") && (
          <Button variant="outline" onClick={resetFilters}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

AttachmentFilters.displayName = "AttachmentFilters"; 