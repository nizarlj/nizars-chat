"use client";

import { useEffect, useRef, memo, useMemo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { type Message } from "ai";
import { Doc } from "@convex/_generated/dataModel";
import { useChatMessages } from "@/components/Chat/context";
import { AttachmentPreviewModal, AttachmentPreview, Attachment } from "@/components/Chat/attachments";
import { MarkdownMessage, MessageActions, ReasoningDisplay } from ".";
import { isEqual } from "lodash";
import { SupportedModelId } from "@/lib/models";

type ChatMessage = Message & { 
  metadata?: Doc<"messages">["metadata"];
  model?: string;
};

const EMPTY_ATTACHMENTS: Attachment[] = [];
function areAttachmentsEqual(attachments1: Attachment[], attachments2: Attachment[]): boolean {
  return attachments1 === attachments2 || (
    attachments1.length === attachments2.length &&
    attachments1.every((attachment, index) => {
      const otherAttachment = attachments2[index];
      return attachment === otherAttachment || (
        attachment.name === otherAttachment.name &&
        attachment.contentType === otherAttachment.contentType &&
        attachment.url === otherAttachment.url
      );
    })
  );
}

interface AttachmentsGridProps {
  attachments: Attachment[];
  onAttachmentClick: (attachment: Attachment) => void;
}

const AttachmentsGrid = memo(function AttachmentsGrid({ 
  attachments, 
  onAttachmentClick 
}: AttachmentsGridProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="relative cursor-pointer"
          onClick={() => onAttachmentClick(attachment)}
        >
          <AttachmentPreview attachment={attachment} />
        </div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  return areAttachmentsEqual(prevProps.attachments, nextProps.attachments);
});

export default function ChatMessages() {
  const { messages, isLoadingMessages, isStreaming, handleRetry } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const handleAttachmentClick = useCallback((attachment: Attachment) => {
    setSelectedAttachment(attachment);
  }, []);

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
        attachments={message.experimental_attachments || EMPTY_ATTACHMENTS}
        onAttachmentClick={handleAttachmentClick}
        onRetry={handleRetry}
      />
    )), [staticMessages, handleAttachmentClick]
  );

  const streamingMessageComponent = useMemo(() => {
    if (!streamingMessage) return null;
    const stableAttachments = streamingMessage.experimental_attachments || EMPTY_ATTACHMENTS;
    
    return (
      <MemoizedMessageBubble 
        key={streamingMessage.id} 
        message={streamingMessage} 
        isStreaming={true}
        attachments={stableAttachments}
        onAttachmentClick={handleAttachmentClick}
        onRetry={handleRetry}
      />
    );
  }, [streamingMessage, handleAttachmentClick, handleRetry]);

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
      <AttachmentPreviewModal 
        attachment={selectedAttachment}
        onOpenChange={(open) => !open && setSelectedAttachment(null)}
      />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  attachments: Attachment[];
  onAttachmentClick: (attachment: Attachment) => void;
  onRetry: (messageToRetry: Message, retryModelId?: SupportedModelId) => Promise<void>;
}

const MessageBubble = memo(function MessageBubble({ 
  message, 
  isStreaming, 
  attachments, 
  onAttachmentClick,
  onRetry
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  
  const handleBranch = useCallback(() => {
    // TODO: Implement branch functionality
    console.log('Branch message:', message.id);
  }, [message.id]);



  const reasoning = useMemo(() => {
    return message.parts?.find(part => part.type === 'reasoning')?.reasoning || '';
  }, [message.parts]);

  return (
    <div className={cn(
      "flex w-full flex-col group",
      isUser ? "items-end" : "items-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg text-base transition-all duration-200 flex flex-col gap-2",
        isUser 
          ? "bg-muted px-4 py-3 ml-12" 
          : "mr-12 w-full",
        isStreaming && "animate-pulse"
      )}>
        <ReasoningDisplay 
          reasoning={reasoning}
          isStreaming={isStreaming}
        />
        <MarkdownMessage 
          content={message.content}
          className="prose-base"
          messageId={message.id}
          isStreaming={isStreaming}
        />
        <AttachmentsGrid 
          attachments={attachments}
          onAttachmentClick={onAttachmentClick}
        />
      </div>
      {
        !isStreaming && (
          <div className="w-full mt-2">
            <MessageActions
              message={message}
              isUser={isUser}
              onBranch={handleBranch}
              onRetry={onRetry}
            />
          </div>
        )
      }
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    (prevProps.isStreaming === nextProps.isStreaming || !nextProps.isStreaming) &&
    areAttachmentsEqual(prevProps.attachments, nextProps.attachments) &&
    prevProps.onAttachmentClick === nextProps.onAttachmentClick &&
    isEqual(prevProps.message, nextProps.message)
  );
});

const MemoizedMessageBubble = memo(MessageBubble); 