"use client"

import { useRef } from "react";
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendIcon, Loader2 } from "lucide-react"
import { Id } from "@convex/_generated/dataModel";
import ModelSelector from "./ModelSelector"
import ModelParamsSelector from "./ModelParamsSelector"
import ReasoningEffortSelector from "./ReasoningEffortSelector"
import SearchToggle from "./SearchToggle"
import { useChatConfig, useChatAttachments } from "./context";
import AttachmentButton from "./attachments/AttachmentButton";
import AttachmentArea from "./attachments/AttachmentArea";

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent, attachmentIds: Id<'attachments'>[]) => void;
  isDisabled?: boolean;
}

export default function ChatInput({ 
  input, 
  onInputChange, 
  onSubmit, 
  isDisabled 
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { selectedModel } = useChatConfig();
  const { attachments, isUploading, uploadAttachments } = useChatAttachments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const attachmentIds = await uploadAttachments();
      onSubmit(e, attachmentIds);
      
    } catch (error) {
      console.error("Error submitting with attachments:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const hasReasoningCapability = selectedModel.capabilities.reasoning;
  const hasWebSearchCapability = selectedModel.capabilities.webSearch;
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
          </div>
        </div>
      </form>
    </div>
  )
} 