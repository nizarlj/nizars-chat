'use client';

import { useChat, type Message, type UseChatOptions, type CreateMessage } from '@ai-sdk/react';
import { ReasoningUIPart } from '@ai-sdk/ui-utils';
import { useAutoResume } from './use-auto-resume';
import { Id } from '@convex/_generated/dataModel';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { SupportedModelId, ChatMessage } from '@/lib/models';
import { ModelParams } from '@convex/schema';
import { FunctionReturnType } from 'convex/server';
import { api } from '@convex/_generated/api';
import { isEqual } from 'lodash';

type ConvexMessagesWithAttachments = FunctionReturnType<typeof api.messages.getThreadMessages>;
type ConvexMessage = ConvexMessagesWithAttachments[number];

type UseResumableChatOptions = Omit<UseChatOptions, 'id'> & {
  threadId?: Id<'threads'>;
  convexMessages: ConvexMessagesWithAttachments | undefined;
  selectedModelId: SupportedModelId;
  modelParams: ModelParams;
};

function convexMessageToUiMessage(msg: ConvexMessage): ChatMessage {
  const baseMessage: ChatMessage = {
    id: msg._id,
    role: msg.role,
    content: msg.content ?? "",
    createdAt: new Date(msg.createdAt),
    model: msg.model,
    status: msg.status,
    parts: msg.reasoning ? [{ type: 'reasoning', reasoning: msg.reasoning, details: { } } as ReasoningUIPart] : [],
    ...(msg.metadata && { metadata: msg.metadata }),
    ...(msg.error && { error: msg.error }),
    ...(msg.providerMetadata && { providerMetadata: msg.providerMetadata }),
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
  
  const overrideModelRef = useRef<{ modelId: SupportedModelId; params: ModelParams } | null>(null);
  
  const initialMessages: ChatMessage[] = useMemo(() => {
    if (!convexMessages) return [];
    
    return convexMessages.map(convexMessageToUiMessage);
  }, [convexMessages]);

  const {
    messages: aiMessages,
    data,
    setMessages,
    experimental_resume,
    handleSubmit: originalHandleSubmit,
    stop,
    status,
    ...chatHelpers
  } = useChat({
    ...options,
    id: threadId,
    // ignore everything after the ? - very hacky but resume provides undefined chatId sometimes
    api: `/api/chat?threadId=${threadId}&nonsense="`,
    initialMessages: initialMessages,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody({ messages }) {
      const modelToUse = overrideModelRef.current?.modelId || selectedModelId;
      const paramsToUse = overrideModelRef.current?.params || modelParams;
      overrideModelRef.current = null;
      
      return { 
        message: messages[messages.length - 1], 
        threadId,
        selectedModelId: modelToUse,
        modelParams: paramsToUse,
        attachmentIds: attachmentIdsRef.current,
      };
    },
  });

  const messages: ChatMessage[] = useMemo(() => {
    if (!convexMessages) return aiMessages as ChatMessage[];

    const convexMessageMap = new Map<string, ConvexMessage>();
    convexMessages.forEach(msg => {
      if (msg.clientId) {
        convexMessageMap.set(msg.clientId, msg);
      }
    });

    return (aiMessages as ChatMessage[]).map(aiMessage => {
      const convexMessage = convexMessageMap.get(aiMessage.id);
      const messageKey = convexMessage ? `convex-${convexMessage._id}` : `ai-${aiMessage.id}`;
      const cachedMessage = messageCache.current.get(messageKey);
      
      if (convexMessage) {
        const newConvexMessage = convexMessageToUiMessage(convexMessage);
        
        if (cachedMessage && isEqual(cachedMessage, newConvexMessage)) {
          return cachedMessage as ChatMessage;
        }
        
        messageCache.current.set(messageKey, newConvexMessage);
        return newConvexMessage;
      }
      
      if (cachedMessage && isEqual(cachedMessage, aiMessage)) {
        return cachedMessage as ChatMessage;
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

    const optimisticAssistantMessage: ChatMessage = {
      id: `optimistic-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
    };
    setMessages([...(aiMessages as ChatMessage[]), optimisticAssistantMessage]);

    originalHandleSubmit(e);
  }, [originalHandleSubmit, setMessages, aiMessages]);

  const append = useCallback(async (
    message: Message | CreateMessage,
    options?: { 
      attachmentIds?: Id<'attachments'>[];
      modelId?: SupportedModelId;
      modelParams?: ModelParams;
    }
  ) => {
    if (options?.attachmentIds) {
      attachmentIdsRef.current = options.attachmentIds;
    }
    
    if (options?.modelId) {
      overrideModelRef.current = {
        modelId: options.modelId,
        params: options.modelParams || modelParams
      };
    }
    
    const optimisticAssistantMessage: ChatMessage = {
      id: `optimistic-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
    };
    setMessages([...(aiMessages as ChatMessage[]), optimisticAssistantMessage]);
    
    return chatHelpers.append(message);
  }, [chatHelpers, modelParams, setMessages, aiMessages]);

  const isStreaming = useMemo(() => {
    return status === "streaming" || convexMessages?.some(message => message.status === "streaming") || false;
  }, [status, convexMessages]);

  useEffect(() => {
    // Set messages when:
    // 1. Messages first load (convexMessages transitions from undefined to having a value)
    // 2. All messages are completed (no streaming in progress)
    if (!convexMessages) return;

    const messagesJustLoaded = !messagesLoaded && convexMessages !== undefined;
    const allMessagesCompleted = convexMessages.every(message => message.status !== "streaming");
    
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
    ...chatHelpers,
    messages,
    data,
    experimental_resume,
    isStreaming,
    stop,
    handleSubmit,
    append,
    setMessages: setMessages as (messages: ChatMessage[] | ((currentMessages: ChatMessage[]) => ChatMessage[])) => void,
  };
}
