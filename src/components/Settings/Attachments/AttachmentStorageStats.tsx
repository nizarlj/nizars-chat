"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Files, HardDrive } from "lucide-react";
import { formatFileSize } from "@/lib/fileUtils";

interface AttachmentStorageStatsProps {
  totalFiles: number;
  totalSize: number;
  isLoading: boolean;
}

export function AttachmentStorageStats({ 
  totalFiles, 
  totalSize, 
  isLoading 
}: AttachmentStorageStatsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">File Storage</CardTitle>
        </div>
        <CardDescription>
          Manage all your uploaded files. Attachments are stored securely and
          are only accessible by you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Files className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Total Files</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <Badge style="outline" color="default" className="font-mono">
                {totalFiles.toLocaleString()}
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Storage Used</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <Badge style="outline" color="info" className="font-mono">
                {formatFileSize(totalSize)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 