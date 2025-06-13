"use client";

import { useChatAttachments } from "../context";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRef } from "react";

interface AttachmentButtonProps {
  disabled?: boolean;
}

export default function AttachmentButton({ disabled }: AttachmentButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addAttachments, isUploading } = useChatAttachments();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addAttachments(Array.from(event.target.files));
      event.target.value = "";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleButtonClick}
            disabled={disabled || isUploading}
            className="border-1"
          >
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add an attachment</p>
          <p className="text-xs text-muted-foreground">
            Accepts: Text, PNG, JPEG, GIF, WebP, HEIC, PDF
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 