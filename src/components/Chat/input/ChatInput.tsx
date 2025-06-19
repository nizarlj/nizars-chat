"use client"

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendIcon, Loader2, Square } from "lucide-react"
import { Id } from "@convex/_generated/dataModel";
import { useChatConfig, useChatAttachments } from "@/components/Chat/context";
import { ModelSelector, ModelParamsSelector, ReasoningEffortSelector, SearchToggle, DictationButton } from ".";
import { AttachmentButton, AttachmentArea } from "@/components/Chat/attachments";
import { useCachedUser } from "@/hooks/useCachedUser";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { type AttachmentData } from "@/types/attachments";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent, attachmentIds: Id<'attachments'>[], attachmentData?: AttachmentData[]) => void;
  isDisabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  isCentered?: boolean;
}

export default function ChatInput({ 
  input, 
  onInputChange, 
  onSubmit, 
  isDisabled,
  isStreaming = false,
  onStop,
  isCentered = false
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isDictating, setIsDictating] = useState(false);
  const { selectedModel } = useChatConfig();
  const { attachments, isUploading, uploadAttachments, getAttachmentData } = useChatAttachments();
  const user = useCachedUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to use the chat", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    try {
      const attachmentIds = await uploadAttachments();
      const attachmentData = getAttachmentData();
      onSubmit(e, attachmentIds, attachmentData);
      
    } catch (error) {
      console.error("Error submitting with attachments:", error);
    }
  };

  const handleTranscriptChange = (transcript: string) => {
    const syntheticEvent = {
      target: { value: transcript },
      currentTarget: { value: transcript }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onInputChange(syntheticEvent);
  };

  const handleListeningChange = (listening: boolean) => {
    setIsDictating(listening);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming && onStop) {
        onStop();
      } else {
        formRef.current?.requestSubmit();
      }
    }
  };

  const hasReasoningCapability = selectedModel.capabilities.reasoning;
  const hasWebSearchCapability = selectedModel.capabilities.search;
  const isSubmitDisabled = (!input.trim() && attachments.length === 0) || isDisabled || isUploading || isDictating;

  return (
    <div className={cn(
      "w-full flex flex-col items-center gap-4 bg-card p-4",
      isCentered 
        ? "border rounded-lg shadow-lg"
        : "border-t border-x rounded-t-md"
    )}>
      <AttachmentArea />
      <form ref={formRef} onSubmit={handleSubmit} className="w-full">
        <Textarea 
          placeholder="Ask me anything..." 
          variant="chat"
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          className={cn(isMobile && "text-base")}
        />
        
        <div className={cn(
          "flex flex-col gap-2 w-full mt-4",
          !isMobile && "flex-row items-center justify-between gap-2"
        )}>
          {isMobile && (
            <div className="w-full flex justify-between">
              <ModelSelector />
              <DictationButton 
                onTranscriptChange={handleTranscriptChange}
                onListeningChange={handleListeningChange}
                disabled={isUploading}
              />
            </div>
          )}

          <div className={cn(
            "flex items-center gap-2 justify-between flex-1"
          )}>
            <div className="flex items-center gap-2">
              {!isMobile && <ModelSelector />}
              {hasReasoningCapability && <ReasoningEffortSelector />}
              {hasWebSearchCapability && <SearchToggle />}
              <AttachmentButton disabled={isUploading} />
              <ModelParamsSelector />
            </div>

            <div className={cn("flex gap-2", isMobile && "flex-col")}>
              {!isMobile && (
                <DictationButton 
                  onTranscriptChange={handleTranscriptChange}
                  onListeningChange={handleListeningChange}
                  disabled={isUploading}
                />
              )}
              <SubmitButton isStreaming={isStreaming} onStop={onStop} isSubmitDisabled={isSubmitDisabled} isDictating={isDictating} isUploading={isUploading} />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}



interface SubmitButtonProps {
  isStreaming: boolean;
  onStop?: () => void;
  isSubmitDisabled: boolean;
  isDictating: boolean;
  isUploading: boolean;
}
function SubmitButton({ isStreaming, onStop, isSubmitDisabled, isDictating, isUploading }: SubmitButtonProps) {
  if (isStreaming) {
    return (
        <Button 
        type="button"
        onClick={onStop}
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        tooltip="Cancel response"
      >
        <Square className="w-4 h-4" />
      </Button>
    )
  }


  return (
    <Button 
      type="submit"
      disabled={isSubmitDisabled}
      size="sm"
      tooltip={isDictating ? "Cannot send while dictating" : "Send message"}
      disabledTooltip={isDictating ? "Cannot send while dictating" : "Please enter a message or add an attachment"}
    >
      {isUploading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <SendIcon className="w-4 h-4" />
      )}
    </Button>
  )
}