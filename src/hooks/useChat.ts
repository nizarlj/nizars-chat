'use client';

import { useChat, type Message, type UseChatOptions } from '@ai-sdk/react';
import { useAutoResume } from './use-auto-resume';
import { Id } from '@convex/_generated/dataModel';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { SupportedModelId } from '@/lib/models';
import { ModelParams } from '@convex/schema';
import { FunctionReturnType } from 'convex/server';
import { api } from '@convex/_generated/api';

type ConvexMessagesWithAttachments = FunctionReturnType<typeof api.messages.getThreadMessages>;
type ConvexMessage = ConvexMessagesWithAttachments[number];

type UseResumableChatOptions = Omit<UseChatOptions, 'id'> & {
  threadId?: Id<'threads'>;
  convexMessages: ConvexMessagesWithAttachments | undefined;
  selectedModelId: SupportedModelId;
  modelParams: ModelParams;
};

function convexMessageToUiMessage(msg: ConvexMessage): Message {
  const baseMessage = {
    id: msg._id,
    role: msg.role,
    content: msg.content ?? "",
    createdAt: new Date(msg.createdAt),
    model: msg.model,
    ...(msg.metadata && { metadata: msg.metadata }),
  };

  if (msg.attachments && msg.attachments.length > 0) {
    return {
      ...baseMessage,
      experimental_attachments: msg.attachments.map((a) => ({
        name: a.fileName,
        contentType: a.mimeType,
        url: a.url,
      })),
    };
  }

  return baseMessage;
}

function messagesAreEqual(msg1: Message, msg2: Message): boolean {
  return msg1.content === msg2.content && msg1.role === msg2.role;
}

export function useResumableChat({
  threadId,
  convexMessages,
  selectedModelId,
  modelParams,
  ...options
}: UseResumableChatOptions) {
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const attachmentIdsRef = useRef<Id<'attachments'>[]>([]);
  const messageCache = useRef<Map<string, Message>>(new Map());
  
  const initialMessages: Message[] = useMemo(() => {
    if (!convexMessages) return [];
    
    return convexMessages.map(convexMessageToUiMessage);
  }, [convexMessages]);

  const {
    messages: aiMessages,
    data,
    setMessages,
    experimental_resume,
    handleSubmit: originalHandleSubmit,
    ...chatHelpers
  } = useChat({
    ...options,
    id: threadId,
    // ignore everything after the ? - very hacky but resume provides undefined chatId sometimes
    api: `/api/chat?threadId=${threadId}&nonsense="`,
    initialMessages: initialMessages,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody({ messages }) {
      return { 
        message: messages[messages.length - 1], 
        threadId,
        selectedModelId,
        modelParams,
        attachmentIds: attachmentIdsRef.current,
      };
    },
  });

  const messages = useMemo(() => {
    if (!convexMessages) return aiMessages;

    const convexMessageMap = new Map<string, ConvexMessage>();
    convexMessages.forEach(msg => {
      if (msg.clientId) {
        convexMessageMap.set(msg.clientId, msg);
      }
    });

    return aiMessages.map(aiMessage => {
      const convexMessage = convexMessageMap.get(aiMessage.id);
      const messageKey = convexMessage ? `convex-${convexMessage._id}` : `ai-${aiMessage.id}`;
      const cachedMessage = messageCache.current.get(messageKey);
      
      if (convexMessage) {
        const newConvexMessage = convexMessageToUiMessage(convexMessage);
        
        if (cachedMessage && messagesAreEqual(cachedMessage, newConvexMessage)) {
          return cachedMessage;
        }
        
        messageCache.current.set(messageKey, newConvexMessage);
        return newConvexMessage;
      }
      
      if (cachedMessage && messagesAreEqual(cachedMessage, aiMessage)) {
        return cachedMessage;
      }
      
      messageCache.current.set(messageKey, aiMessage);
      return aiMessage;
    });
  }, [aiMessages, convexMessages]);

  const handleSubmit = useCallback((
    e: React.FormEvent<HTMLFormElement>,
    attachmentIds: Id<'attachments'>[] = []
  ) => {
    attachmentIdsRef.current = attachmentIds;
    originalHandleSubmit(e);
  }, [originalHandleSubmit]);

  const isStreaming = useMemo(() => {
    return convexMessages?.some(message => message.status !== "completed") || false;
  }, [convexMessages]);

  useEffect(() => {
    // Set messages when:
    // 1. Messages first load (convexMessages transitions from undefined to having a value)
    // 2. All messages are completed (no streaming in progress)
    if (!convexMessages) return;

    const messagesJustLoaded = !messagesLoaded && convexMessages !== undefined;
    const allMessagesCompleted = convexMessages.every(message => message.status === "completed");
    
    if (messagesJustLoaded) {
      // First load - set all messages from Convex
      setMessages(initialMessages);
      setMessagesLoaded(true);
    } else if (allMessagesCompleted) {
      // All messages completed - replace everything with Convex state to ensure proper IDs
      setMessages(initialMessages);
      messageCache.current.clear();
    }
  }, [setMessages, convexMessages, initialMessages, messagesLoaded]);

  useAutoResume({
    autoResume: true,
    experimental_resume,
    threadId: threadId || '',
    messagesLoaded,
  });

  return {
    messages,
    data,
    setMessages,
    experimental_resume,
    isStreaming,
    ...chatHelpers,
    handleSubmit,
  };
}
