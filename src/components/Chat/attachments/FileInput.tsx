"use client";

import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Model } from "@/lib/models";
import { getAcceptedFileTypes, getFileTypesTooltipContent } from "@/lib/fileUtils";

interface FileInputProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  children?: React.ReactNode;
  className?: string;
  model?: Model;
}

export default function FileInput({
  onFilesSelected,
  disabled = false,
  multiple = true,
  children,
  className = "",
  model,
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
      event.target.value = "";
    }
  }, [onFilesSelected]);

  const acceptedTypes = getAcceptedFileTypes(model);
  const tooltipContent = getFileTypesTooltipContent(model);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={handleButtonClick}
            disabled={disabled}
            className={className}
          >
            {children || (
              <>
                <Paperclip className="h-4 w-4" />
                {!isMobile && "Attach"}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent.title}</p>
          <p className="text-xs text-muted-foreground">
            {tooltipContent.description}
          </p>
        </TooltipContent>
      </Tooltip>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple={multiple}
        accept={acceptedTypes.join(",")}
      />
    </>
  );
} 