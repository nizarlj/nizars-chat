"use client";

import { Upload, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Model } from "@/lib/models";
import { getSupportedTypesDescription } from "@/lib/fileUtils";

interface DragDropOverlayProps {
  isVisible: boolean;
  className?: string;
  model?: Model;
}

export default function DragDropOverlay({ 
  isVisible, 
  className,
  model 
}: DragDropOverlayProps) {
  if (!isVisible) return null;

  const supportedTypesDescription = getSupportedTypesDescription(model);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        "border-2 border-dashed border-primary/50",
        "transition-all duration-200",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <Upload className="w-16 h-16 text-primary/30" />
          </div>
          <Upload className="w-16 h-16 text-primary relative z-10" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Drop files here
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Release to add files to your message
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <FileIcon className="w-3 h-3" />
            <span>{supportedTypesDescription}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 