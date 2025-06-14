"use client";

import { useState, memo } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MarkdownMessage from "./MarkdownMessage";

interface ReasoningDisplayProps {
  reasoning: string;
  isStreaming?: boolean;
  className?: string;
}

const ReasoningDisplay = memo(function ReasoningDisplay({ 
  reasoning, 
  isStreaming = false,
  className 
}: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(isStreaming);

  if (!reasoning) return null;

  return (
    <div className={cn(
      "border rounded-lg bg-muted/30",
      // isStreaming && "animate-pulse",
      className
    )}>
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-start gap-2 p-3 h-auto font-normal text-sm text-muted-foreground hover:text-foreground"
      >
        <Brain className="h-4 w-4 text-purple-300" />
        <span>Reasoning</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 ml-auto" />
        ) : (
          <ChevronRight className="h-4 w-4 ml-auto" />
        )}
      </Button>
      
      {isExpanded && (
        <div className={"px-3 pb-3 border-t bg-muted/10"}>
          <MarkdownMessage 
            content={reasoning}
            className="prose-sm text-muted-foreground"
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.reasoning === nextProps.reasoning &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.className === nextProps.className
  );
});

export default ReasoningDisplay; 