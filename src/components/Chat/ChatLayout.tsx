"use client";

import { useRef, useEffect } from "react";
import { ChatProvider, type ChatHandlers, useChatAttachments, useChatConfig } from "@/components/Chat/context";
import { ChatInput } from "@/components/Chat/input";
import { DragDropOverlay } from "@/components/Chat/attachments";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

interface ChatLayoutProps {
  children: React.ReactNode;
}

function ChatLayoutInner({ 
  children, 
  handlers 
}: { 
  children: React.ReactNode; 
  handlers: ChatHandlers; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { addAttachments, isUploading } = useChatAttachments();
  const { selectedModel } = useChatConfig();

  const { isDragOver, bindDropZone } = useDragAndDrop({
    onFilesDropped: addAttachments,
    disabled: isUploading,
    model: selectedModel
  });

  useEffect(() => {
    const cleanup = bindDropZone(containerRef.current);
    return cleanup;
  }, [bindDropZone]);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col relative">
      <div className="flex-1">
        {children}
      </div>

      <div className="px-4 sticky bottom-0">
        <ChatInput
          input={handlers.input}
          onInputChange={handlers.handleInputChange}
          onSubmit={handlers.handleSubmit}
          isDisabled={false}
          isStreaming={handlers.isStreaming}
          onStop={handlers.stop}
        />
      </div>
      
      <DragDropOverlay 
        isVisible={isDragOver} 
        model={selectedModel}
      />
    </div>
  );
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <ChatProvider>
      {(handlers: ChatHandlers) => (
        <ChatLayoutInner handlers={handlers}>
          {children}
        </ChatLayoutInner>
      )}
    </ChatProvider>
  );
}