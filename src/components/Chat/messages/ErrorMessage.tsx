"use client";

import { memo } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Message } from "ai";
import { SupportedModelId, ChatMessage } from "@/lib/models";
import RetryModelSelector from "./RetryModelSelector";

interface ErrorMessageProps {
  message: ChatMessage;
  onRetry?: (messageToRetry: Message, retryModelId?: SupportedModelId) => void;
  className?: string;
}

const ErrorMessage = memo(function ErrorMessage({ 
  message, 
  onRetry,
  className 
}: ErrorMessageProps) {
  const handleRetryWithModel = async (modelId: SupportedModelId) => {
    if (onRetry) await onRetry(message, modelId);
  };

  const errorContent = message.error || "An error occurred while processing your request.";

  return (
    <div className={cn(
      "flex w-full flex-col group items-start",
      className
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg text-base transition-all duration-200 flex flex-col gap-3",
        "mr-12 w-full",
        "border border-destructive/20 bg-destructive/5 p-4"
      )}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium text-destructive">
              Error
            </div>
            <div className="text-sm text-muted-foreground">
              {errorContent}
            </div>
          </div>
        </div>
        
        {onRetry && (
          <div className="flex justify-end">
            <RetryModelSelector
              currentModelId={message.model}
              onRetry={handleRetryWithModel}
              variant="error"
            />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.onRetry === nextProps.onRetry &&
    prevProps.className === nextProps.className
  );
});

export default ErrorMessage; 