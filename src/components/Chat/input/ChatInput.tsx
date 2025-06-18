"use client"

import { useRef } from "react";
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendIcon, Loader2, Square } from "lucide-react"
import { Id } from "@convex/_generated/dataModel";
import { useChatConfig, useChatAttachments } from "@/components/Chat/context";
import { ModelSelector, ModelParamsSelector, ReasoningEffortSelector, SearchToggle } from ".";
import { AttachmentButton, AttachmentArea } from "@/components/Chat/attachments";
import { useCachedUser } from "@/hooks/useCachedUser";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { type AttachmentData } from "@/types/attachments";

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent, attachmentIds: Id<'attachments'>[], attachmentData?: AttachmentData[]) => void;
  isDisabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}

export default function ChatInput({ 
  input, 
  onInputChange, 
  onSubmit, 
  isDisabled,
  isStreaming = false,
  onStop
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { selectedModel } = useChatConfig();
  const { attachments, isUploading, uploadAttachments, getAttachmentData } = useChatAttachments();
  const user = useCachedUser();
  const navigate = useNavigate();
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
  const isSubmitDisabled = (!input.trim() && attachments.length === 0) || isDisabled || isUploading;

  return (
    <div className="w-full flex flex-col items-center gap-4 bg-card p-4 border-t border-x rounded-t-md">
      <AttachmentArea />
      <form ref={formRef} onSubmit={handleSubmit} className="w-full">
        <Textarea 
          placeholder="Ask me anything..." 
          variant="chat"
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
        />
        
        <div className="flex items-center justify-between gap-2 w-full mt-4">
          <div className="flex items-center justify-start gap-2 flex-1">
            <ModelSelector />
            {hasReasoningCapability && <ReasoningEffortSelector />}
            {hasWebSearchCapability && <SearchToggle />}
            <AttachmentButton disabled={isUploading} />
            <ModelParamsSelector />
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <Button 
                type="button"
                onClick={onStop}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={isSubmitDisabled}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
} 