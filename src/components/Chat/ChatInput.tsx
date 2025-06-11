"use client"

import { useRef } from "react";
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendIcon } from "lucide-react"
import ModelSelector from "./ModelSelector"
import ModelParamsSelector from "./ModelParamsSelector"
import ReasoningEffortSelector from "./ReasoningEffortSelector"
import SearchToggle from "./SearchToggle"
import { useChatConfig } from "./ChatLayout"

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const hasReasoningCapability = selectedModel.capabilities.reasoning;
  const hasWebSearchCapability = selectedModel.capabilities.webSearch;

  return (
    <div className="w-full flex flex-col items-center gap-4 bg-card p-4 border-t border-x rounded-t-md">
      <form ref={formRef} onSubmit={onSubmit} className="w-full">
        <Textarea 
          placeholder="Ask me anything..." 
          variant="chat"
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          className={isDisabled ? "opacity-50" : ""}
        />
        
        <div className="flex items-center justify-between gap-2 w-full mt-4">
          <div className="flex items-center justify-start gap-2 flex-1">
            <ModelSelector />
            {hasReasoningCapability && <ReasoningEffortSelector />}
            {hasWebSearchCapability && <SearchToggle />}
            <ModelParamsSelector />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              type="submit"
              disabled={!input.trim() || isDisabled}
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
} 