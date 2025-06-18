"use client";

import { memo } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import MarkdownMessage from "./MarkdownMessage";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

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
  if (!reasoning) return null;

  return (
    <Collapsible
      defaultOpen={isStreaming}
      className={cn("border rounded-lg bg-muted/30", className)}
    >
      <CollapsibleTrigger className="cursor-pointer group w-full flex items-center justify-start gap-2 p-3 h-auto font-normal text-sm text-muted-foreground hover:text-foreground rounded-t-lg">
        <Brain className="h-4 w-4 text-purple-300" />
        <span>Reasoning</span>
        <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className={"px-3 pb-3 border-t bg-muted/10"}>
          <MarkdownMessage 
            content={reasoning}
            className="prose-sm text-muted-foreground"
            isStreaming={isStreaming}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.reasoning === nextProps.reasoning &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.className === nextProps.className
  );
});

export default ReasoningDisplay; 