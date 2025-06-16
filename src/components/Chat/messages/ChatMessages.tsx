"use client";

import { useEffect, useRef, memo, useMemo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { type Message } from "ai";
import { Id } from "@convex/_generated/dataModel";
import { useChatMessages } from "@/components/Chat/context";
import { AttachmentPreviewModal, AttachmentPreview, Attachment } from "@/components/Chat/attachments";
import { MarkdownMessage, MessageActions, ReasoningDisplay, MessageEditor, LoadingMessage, ErrorMessage } from ".";
import { isEqual } from "lodash";
import { SupportedModelId, ChatMessage } from "@/lib/models";
import { type FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";

type ConvexMessages = FunctionReturnType<typeof api.messages.getThreadMessages>;

function getOriginalAttachmentIds(convexMessages: ConvexMessages | undefined, messageId: string): Id<'attachments'>[] {
  if (!convexMessages) return [];
  const convexMessage = convexMessages.find(m => m._id === messageId);
  return convexMessage?.attachmentIds || [];
}

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

function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  
  return ref.current;
}

export default function ChatMessages() {
  const { messages, isLoadingMessages, isStreaming, handleRetry, handleEdit, convexMessages } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleAttachmentClick = useCallback((attachment: Attachment) => {
    setSelectedAttachment(attachment);
  }, []);

  const handleStartEdit = useCallback((message: Message) => {
    setEditingMessageId(message.id);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const handleSaveEdit = useCallback(async (message: Message, newContent: string, attachmentIds: Id<'attachments'>[]) => {
    await handleEdit(message, newContent, attachmentIds);
    setEditingMessageId(null);
  }, [handleEdit]);

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
  const memoizedStaticMessages = useDeepMemo(staticMessages);

  const renderedStaticMessages = useMemo(() => 
    memoizedStaticMessages?.map((message: ChatMessage) => (
      <MemoizedMessageBubble 
        key={message.id} 
        message={message} 
        isStreaming={false}
        attachments={message.experimental_attachments || EMPTY_ATTACHMENTS}
        onAttachmentClick={handleAttachmentClick}
        onRetry={handleRetry}
        onEdit={handleStartEdit}
        isEditing={editingMessageId === message.id}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        originalAttachmentIds={getOriginalAttachmentIds(convexMessages, message.id)}
      />
    )), [memoizedStaticMessages, handleAttachmentClick, handleRetry, handleStartEdit, editingMessageId, handleCancelEdit, handleSaveEdit, convexMessages]
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
        onEdit={handleStartEdit}
        isEditing={editingMessageId === streamingMessage.id}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        originalAttachmentIds={getOriginalAttachmentIds(convexMessages, streamingMessage.id)}
      />
    );
  }, [streamingMessage, handleAttachmentClick, handleRetry, handleStartEdit, editingMessageId, handleCancelEdit, handleSaveEdit, convexMessages]);

  return (
    <div className="flex-1 p-4 space-y-6">
      {(!messages || messages.length === 0) && !isMessageStreaming && !isLoadingMessages && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      )}

      {renderedStaticMessages}
      {streamingMessageComponent}
      {
        isStreaming && streamingMessage === null && (
          <LoadingMessage />
        )
      }

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
  onEdit: (message: Message) => void;
  isEditing: boolean;
  onCancelEdit: () => void;
  onSaveEdit: (message: Message, newContent: string, attachmentIds: Id<'attachments'>[]) => Promise<void>;
  originalAttachmentIds: Id<'attachments'>[];
}

const MessageBubble = memo(function MessageBubble({ 
  message, 
  isStreaming, 
  attachments, 
  onAttachmentClick,
  onRetry,
  onEdit,
  isEditing,
  onCancelEdit,
  onSaveEdit,
  originalAttachmentIds
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error" && message.role === "assistant";
  
  const handleBranch = useCallback(() => {
    // TODO: Implement branch functionality
    console.log('Branch message:', message.id);
  }, [message.id]);

  const reasoning = useMemo(() => {
    return message.parts?.find(part => part.type === 'reasoning')?.reasoning || '';
  }, [message.parts]);

  const handleEditSave = useCallback(async (newContent: string, attachmentIds: Id<'attachments'>[]) => {
    await onSaveEdit(message, newContent, attachmentIds);
  }, [onSaveEdit, message]);

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
        
        {isEditing && isUser ? (
          <MessageEditor
            initialContent={message.content}
            initialMessage={message}
            originalAttachmentIds={originalAttachmentIds}
            onSave={handleEditSave}
            onCancel={onCancelEdit}
          />
        ) : (
          <MarkdownMessage 
            content={message.content}
            className="prose-base"
            messageId={message.id}
            isStreaming={isStreaming}
          />
        )}

        {
          isError && (
            <ErrorMessage 
              message={message}
              onRetry={onRetry}
            />
          )
        }
        
        <AttachmentsGrid 
          attachments={attachments}
          onAttachmentClick={onAttachmentClick}
        />
      </div>
      {
        !isStreaming && !isEditing && (
          <div className="w-full mt-2">
            <MessageActions
              message={message}
              isUser={isUser}
              onBranch={handleBranch}
              onRetry={onRetry}
              onEdit={onEdit}
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
    prevProps.isEditing === nextProps.isEditing &&
    isEqual(prevProps.message, nextProps.message)
  );
});

const MemoizedMessageBubble = memo(MessageBubble); 