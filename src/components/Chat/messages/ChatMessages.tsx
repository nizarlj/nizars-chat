"use client";

import { useEffect, useRef, memo, useMemo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { type Message } from "ai";
import { Id } from "@convex/_generated/dataModel";
import { useChatMessages } from "@/components/Chat/context";
import { useIsMobile } from "@/hooks/use-mobile";
import { AttachmentPreviewModal, AttachmentPreview, Attachment } from "@/components/Chat/attachments";
import { MarkdownMessage, MessageActions, ReasoningDisplay, MessageEditor, LoadingMessage, ErrorMessage, SearchResults } from ".";
import { isEqual } from "lodash";
import { SupportedModelId, ChatMessage } from "@/lib/models";
import { type FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { type AttachmentData } from "@/types/attachments";
import { useLocation } from "react-router-dom";

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

interface ChatMessagesProps {
  messages?: ChatMessage[];
  isReadOnly?: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({ messages: messagesProp, isReadOnly = false,  messagesEndRef: externalMessagesEndRef }: ChatMessagesProps) {
  const context = useChatMessages();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const messages = messagesProp || context.messages;
  const isStreaming = messagesProp ? false : context.isStreaming;
  const convexMessages = messagesProp ? undefined : context.convexMessages;

  const internalMessagesEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = externalMessagesEndRef || internalMessagesEndRef;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const highlightedOnceRef = useRef<string | null>(null);

  // Extract messageId from URL params
  const urlParams = new URLSearchParams(location.search);
  const targetMessageId = urlParams.get('messageId');

  // Handle highlighting and scrolling to specific message
  useEffect(() => {
    if (targetMessageId && messages.length > 0) {
      if (highlightedOnceRef.current === targetMessageId) return;

      const messageElement = messageRefs.current.get(targetMessageId);
      if (messageElement) {
        // Scroll to the message
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Highlight the message
        setHighlightedMessageId(targetMessageId);
        highlightedOnceRef.current = targetMessageId;
        
        // Remove highlight after 3 seconds
        const timer = setTimeout(() => {
          setHighlightedMessageId(null);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    } else if (!targetMessageId) {
      highlightedOnceRef.current = null;
    }
  }, [targetMessageId, messages.length]);

  const handleRetry = useMemo(() => {
    return messagesProp ? () => {} : context.handleRetry;
  }, [messagesProp, context.handleRetry]);

  const handleEdit = useMemo(() => {
    return messagesProp ? async () => {} : context.handleEdit;
  }, [messagesProp, context.handleEdit]);

  const handleBranch = useMemo(() => {
    return messagesProp ? async () => {} : context.handleBranch;
  }, [messagesProp, context.handleBranch]);

  const handleAttachmentClick = useCallback((attachment: Attachment) => {
    setSelectedAttachment(attachment);
  }, []);

  const handleStartEdit = useCallback((message: Message) => {
    setEditingMessageId(message.id);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const handleSaveEdit = useCallback(async (
    message: Message, 
    newContent: string, 
    attachmentIds: Id<'attachments'>[],
    attachmentData?: AttachmentData[]
  ) => {
    await handleEdit(message, newContent, attachmentIds, attachmentData);
    setEditingMessageId(null);
  }, [handleEdit]);

  useEffect(() => {
    if (messages.length === 0) return;
    
    // If this is the first load scroll instantly
    if (previousMessageCount.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    } 

    previousMessageCount.current = messages.length;
  }, [messages, messagesEndRef]);

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
        onBranch={handleBranch}
        isEditing={editingMessageId === message.id}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        originalAttachmentIds={getOriginalAttachmentIds(convexMessages, message.id)}
        isReadOnly={isReadOnly}
        isHighlighted={highlightedMessageId === message.id}
        onRefUpdate={(ref) => {
          if (ref) {
            messageRefs.current.set(message.id, ref);
          } else {
            messageRefs.current.delete(message.id);
          }
        }}
      />
    )), [memoizedStaticMessages, handleAttachmentClick, handleRetry, handleStartEdit, editingMessageId, handleCancelEdit, handleSaveEdit, convexMessages, handleBranch, isReadOnly, highlightedMessageId]
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
        onBranch={handleBranch}
        isEditing={editingMessageId === streamingMessage.id}
        onCancelEdit={handleCancelEdit}
        onSaveEdit={handleSaveEdit}
        originalAttachmentIds={getOriginalAttachmentIds(convexMessages, streamingMessage.id)}
        isReadOnly={isReadOnly}
        isHighlighted={highlightedMessageId === streamingMessage.id}
        onRefUpdate={(ref) => {
          if (ref) {
            messageRefs.current.set(streamingMessage.id, ref);
          } else {
            messageRefs.current.delete(streamingMessage.id);
          }
        }}
      />
    );
  }, [streamingMessage, handleAttachmentClick, handleRetry, handleStartEdit, editingMessageId, handleCancelEdit, handleSaveEdit, convexMessages, handleBranch, isReadOnly, highlightedMessageId]);

  return (
    <div className={cn(
      "flex-1 space-y-6", 
      isMobile ? "p-2" : "p-4"
    )} ref={messagesContainerRef}>
      {renderedStaticMessages}
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
  onRetry: (messageToRetry: Message, retryModelId?: SupportedModelId) => void;
  onEdit: (message: Message) => void;
  onBranch: (message: Message) => Promise<void>;
  isEditing: boolean;
  onCancelEdit: () => void;
  onSaveEdit: (message: Message, newContent: string, attachmentIds: Id<'attachments'>[], attachmentData?: AttachmentData[]) => Promise<void>;
  originalAttachmentIds: Id<'attachments'>[];
  isReadOnly?: boolean;
  isHighlighted?: boolean;
  onRefUpdate?: (ref: HTMLDivElement | null) => void;
}

const MessageBubble = memo(function MessageBubble({ 
  message, 
  isStreaming, 
  attachments, 
  onAttachmentClick,
  onRetry,
  onEdit,
  onBranch,
  isEditing,
  onCancelEdit,
  onSaveEdit,
  originalAttachmentIds,
  isReadOnly = false,
  isHighlighted = false,
  onRefUpdate,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error" && message.role === "assistant";
  const isGenerating = isStreaming && !message.content && !isError;
  const isMobile = useIsMobile();
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Update ref when component mounts/unmounts
  useEffect(() => {
    if (onRefUpdate) {
      onRefUpdate(messageRef.current);
      return () => onRefUpdate(null);
    }
  }, [onRefUpdate]);

  const reasoning = useMemo(() => {
    return message.parts?.find(part => part.type === 'reasoning')?.reasoning || '';
  }, [message.parts]);

  const handleEditSave = useCallback(async (
    newContent: string, 
    attachmentIds: Id<'attachments'>[],
    attachmentData?: AttachmentData[]
  ) => {
    await onSaveEdit(message, newContent, attachmentIds, attachmentData);
  }, [onSaveEdit, message]);

  return (
    <div 
      ref={messageRef}
      className={cn(
        "flex w-full flex-col group transition-all duration-500",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div className={cn(
        "rounded-lg text-base transition-all duration-300 flex flex-col gap-2 hover:shadow-sm",
        isUser 
          ? cn(
              "bg-primary/10 px-4 py-3 border border-primary/20 shadow-sm",
              isMobile ? "ml-4 max-w-[85%]" : "ml-12 max-w-[80%]",
              isHighlighted && "ring-2 ring-primary bg-primary/20 scale-105"
            )
          : cn(
              "w-full",
              isMobile ? "mr-4" : "mr-12",
              isHighlighted && "ring-2 ring-primary bg-primary/5 rounded-lg p-2 scale-105"
            ),
        attachments.length > 0 && "w-full"
      )}>
        <ReasoningDisplay 
          reasoning={reasoning}
          isStreaming={isStreaming}
        />
        
        {isGenerating ? (
          <LoadingMessage />
        ) : isEditing && isUser && !isReadOnly ? (
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
              isReadOnly={isReadOnly}
            />
          )
        }
        
        <AttachmentsGrid 
          attachments={attachments}
          onAttachmentClick={onAttachmentClick}
        />
        {message.providerMetadata && <SearchResults metadata={message.providerMetadata} />}
      </div>
      {
        !isStreaming && !isEditing && (
          <div className="w-full mt-2">
            <MessageActions
              message={message}
              isUser={isUser}
              onBranch={onBranch}
              onRetry={onRetry}
              onEdit={onEdit}
              isReadOnly={isReadOnly}
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
    prevProps.isHighlighted === nextProps.isHighlighted &&
    isEqual(prevProps.message, nextProps.message) &&
    prevProps.isReadOnly === nextProps.isReadOnly
  );
});

const MemoizedMessageBubble = memo(MessageBubble); 