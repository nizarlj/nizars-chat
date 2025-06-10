"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { type Message } from "ai";
import { Doc } from "@convex/_generated/dataModel";

type ChatMessage = Message & { metadata?: Doc<"messages">["metadata"] };

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export default function ChatMessages({ 
  messages,
  isLoading
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);
  
  useEffect(() => {
    if (messages.length === 0) return;
    
    // If this is the first load scroll instantly
    if (previousMessageCount.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    } 

    previousMessageCount.current = messages.length;
  }, [messages]);

  const lastMessage = messages[messages.length - 1];
  const isStreaming = isLoading && lastMessage?.role === 'assistant';

  // if (isLoading && messages.length === 0) {
  //   return (
  //     <div className="flex-1 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex-1 p-4 space-y-4">
      {(!messages || messages.length === 0) && !isStreaming && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      )}

      {messages?.map((message: ChatMessage, index) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          isStreaming={isStreaming && index === messages.length - 1}
        />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  
  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2 text-sm transition-opacity",
        isUser 
          ? "bg-primary text-primary-foreground ml-12" 
          : "bg-muted mr-12",
        isStreaming && "animate-pulse"
      )}>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
} 