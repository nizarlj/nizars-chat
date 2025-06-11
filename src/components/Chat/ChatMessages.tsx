"use client";

import { useEffect, useRef, memo, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { type Message } from "ai";
import { Doc } from "@convex/_generated/dataModel";
import MarkdownMessage from "./MarkdownMessage";
import MessageActions from "./MessageActions";
import { useChatMessages } from "./ChatLayout";

type ChatMessage = Message & { 
  metadata?: Doc<"messages">["metadata"];
  model?: string;
};

export default function ChatMessages() {
  const { messages, isLoadingMessages, isStreaming } = useChatMessages();
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
  const isMessageStreaming = isStreaming && lastMessage?.role === 'assistant';

  // Optimize message rendering by splitting static and streaming messages
  const { staticMessages, streamingMessage } = useMemo(() => {
    if (!isMessageStreaming || messages.length === 0) {
      return { staticMessages: messages, streamingMessage: null };
    }
    
    return {
      staticMessages: messages.slice(0, -1),
      streamingMessage: messages[messages.length - 1]
    };
  }, [messages, isMessageStreaming]);

  const memoizedStaticMessages = useMemo(() => 
    staticMessages?.map((message: ChatMessage) => (
      <MemoizedMessageBubble 
        key={message.id} 
        message={message} 
        isStreaming={false}
      />
    )), [staticMessages]
  );

  const streamingMessageComponent = useMemo(() => {
    if (!streamingMessage) return null;
    
    return (
      <MemoizedMessageBubble 
        key={streamingMessage.id} 
        message={streamingMessage} 
        isStreaming={true}
      />
    );
  }, [streamingMessage]);

  return (
    <div className="flex-1 p-4 space-y-6">
      {(!messages || messages.length === 0) && !isMessageStreaming && !isLoadingMessages && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      )}

      {memoizedStaticMessages}
      {streamingMessageComponent}

      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

const MessageBubble = memo(function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  
  const handleBranch = useCallback(() => {
    // TODO: Implement branch functionality
    console.log('Branch message:', message.id);
  }, [message.id]);

  const handleRetry = useCallback(() => {
    // TODO: Implement retry functionality
    console.log('Retry message:', message.id);
  }, [message.id]);
  
  return (
    <div className={cn(
      "flex w-full flex-col group",
      isUser ? "items-end" : "items-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg text-base transition-all duration-200",
        isUser 
          ? "bg-muted px-4 py-3 ml-12" 
          : "mr-12 w-full",
        isStreaming && "animate-pulse"
      )}>
        <MarkdownMessage 
          content={message.content}
          className="prose-base"
          messageId={message.id}
          isStreaming={isStreaming}
        />
      </div>
      
      {
        !isStreaming && (
          <div className="w-full mt-2">
            <MessageActions
              message={message}
              isUser={isUser}
              onBranch={handleBranch}
              onRetry={handleRetry}
            />
          </div>
        )
      }
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.role === nextProps.message.role &&
    (prevProps.isStreaming === nextProps.isStreaming || !nextProps.isStreaming)
  );
});

const MemoizedMessageBubble = memo(MessageBubble); 