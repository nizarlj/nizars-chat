"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface LoadingMessageProps {
  className?: string;
}

const LoadingMessage = memo(function LoadingMessage({ className }: LoadingMessageProps) {
  return (
    <div className={cn(
      "flex w-full flex-col group items-start",
      className
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg text-base transition-all duration-200 flex flex-col gap-2",
        "mr-12 w-full"
      )}>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
});

export default LoadingMessage;