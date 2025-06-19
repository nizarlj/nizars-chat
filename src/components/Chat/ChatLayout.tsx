"use client";

import { useRef, useEffect, cloneElement, isValidElement, useState } from "react";
import { ChatProvider, type ChatHandlers, useChatAttachments, useChatConfig, useChatMessages } from "@/components/Chat/context";
import { ChatInput } from "@/components/Chat/input";
import { DragDropOverlay } from "@/components/Chat/attachments";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import ScrollToBottomButton from "./ScrollToBottomButton";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: React.ReactNode;
  threadId?: Id<"threads">;
  isActive?: boolean;
  isNewChat?: boolean;
}

function ChatLayoutInner({ 
  children, 
  handlers,
  threadId,
  isNewChat
}: { 
  children: React.ReactNode; 
  handlers: ChatHandlers;
  threadId?: Id<"threads">;
  isNewChat?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addAttachments, isUploading } = useChatAttachments();
  const { selectedModel } = useChatConfig();
  const { messages, isLoadingMessages } = useChatMessages();
  const [hasMessages, setHasMessages] = useState(false);

  const { isDragOver, bindDropZone } = useDragAndDrop({
    onFilesDropped: addAttachments,
    disabled: isUploading,
    model: selectedModel
  });

  useEffect(() => {
    const cleanup = bindDropZone(containerRef.current);
    return cleanup;
  }, [bindDropZone]);

  // Track when messages are added for animation
  useEffect(() => {
    if (messages.length > 0) {
      setHasMessages(true);
    } else if (isNewChat && messages.length === 0) {
      setHasMessages(false);
    }
  }, [messages.length, isNewChat]);

  // Clone children and pass messagesEndRef if it's a valid React element
  const childrenWithRef = isValidElement(children) 
    ? cloneElement(children, { messagesEndRef } as { messagesEndRef?: React.RefObject<HTMLDivElement | null> })
    : children;

  if (threadId && !isNewChat) {
    return (
      <div ref={containerRef} className="flex-1 flex flex-col relative">
        <div className="flex-1">
          {childrenWithRef}
        </div>

        <div className="px-4 sticky bottom-0">
          <ScrollToBottomButton 
            messagesCount={messages.length}
          />
          <ChatInput
            input={handlers.input}
            onInputChange={handlers.handleInputChange}
            onSubmit={handlers.handleSubmit}
            isDisabled={false}
            isStreaming={handlers.isStreaming}
            onStop={handlers.stop}
            isCentered={false}
          />
        </div>
        
        <DragDropOverlay 
          isVisible={isDragOver} 
          model={selectedModel}
        />
      </div>
    );
  }

  const shouldCenter = !hasMessages && !isLoadingMessages;
  return (
    <div ref={containerRef} className="flex-1 flex flex-col relative">
      <div className="flex-1">
        {childrenWithRef}
      </div>

      <div 
        className={cn(
          "absolute inset-x-0 px-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          shouldCenter 
            ? "top-1/2 -translate-y-1/2"
            : "top-full -translate-y-full"
        )}
      >
        {!shouldCenter && (
          <ScrollToBottomButton 
            messagesCount={messages.length}
          />
        )}
        
        <div className={cn(
          "w-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          shouldCenter ? "max-w-2xl mx-auto" : "max-w-none"
        )}>
          <div className={cn(
              "text-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              shouldCenter 
                ? "max-h-40 opacity-100 mb-8 scale-in"
                : "max-h-0 opacity-0"
          )}>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground via-primary to-violet-600 bg-clip-text text-transparent">
              Nizar&apos;s Chat
            </h1>
            <p className="mt-3 text-lg text-muted-foreground font-medium">
                How can I help you today?
            </p>
          </div>
          
          <div className={cn(
            "relative transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            shouldCenter ? "scale-in" : ""
          )}>
            {shouldCenter && (
              <div className="pointer-events-none absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -left-48 -top-24 w-[28rem] h-[28rem] bg-primary/10 rounded-full blur-3xl animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                <div className="absolute -right-48 -bottom-24 w-[32rem] h-[32rem] bg-violet-500/10 rounded-full blur-3xl animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite] [animation-delay:'2s']" />
              </div>
            )}
            <ChatInput
              input={handlers.input}
              onInputChange={handlers.handleInputChange}
              onSubmit={handlers.handleSubmit}
              isDisabled={false}
              isStreaming={handlers.isStreaming}
              onStop={handlers.stop}
              isCentered={shouldCenter}
            />
          </div>
        </div>
      </div>
      
      <DragDropOverlay 
        isVisible={isDragOver} 
        model={selectedModel}
      />
    </div>
  );
}

export default function ChatLayout({ children, threadId, isActive = true, isNewChat = false }: ChatLayoutProps) {
  return (
    <div 
      className={cn(
        "flex-1 flex flex-col relative transition-smooth",
        !isActive && "hidden"
      )}
    >
      <ChatProvider threadId={threadId} isNewChat={isNewChat}>
        {(handlers: ChatHandlers) => (
          <ChatLayoutInner handlers={handlers} threadId={threadId} isNewChat={isNewChat}>
            {children}
          </ChatLayoutInner>
        )}
      </ChatProvider>
    </div>
  );
}