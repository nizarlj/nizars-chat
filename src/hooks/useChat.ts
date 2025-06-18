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
    clientId: msg.clientId,
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
  const attachmentIdsRef = useRef<Id<'attachments'>[]>([]);
  const overrideModelRef = useRef<{ modelId: SupportedModelId; params: ModelParams } | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<ChatMessage>>>(new Map());
  const [optimisticMessageCache, setOptimisticMessageCache] = useState<ChatMessage[] | null>(null);
  const nextAssistantStreamIdRef = useRef<string | null>(null);

  const idGenerator = useMemo(() => {
    let i = 0;
    // Add a random component to the prefix to avoid collisions on refresh
    const randomPrefix = Math.random().toString(36).slice(2, 7);
    const threadPrefix = threadId ? `${threadId}-` : '';
    const prefix = `client-${threadPrefix}${randomPrefix}-`;

    return {
      next: () => `${prefix}${i++}`,
      // Predict the next ID without consuming it
      // Assumes the user message will consume one ID
      peek: (offset = 0) => `${prefix}${i + offset}`,
    };
  }, [threadId]);

  const applyOptimisticUpdate = useCallback((messageId: string, update: Partial<ChatMessage>) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      const existingUpdate = newMap.get(messageId) || {};
      newMap.set(messageId, { ...existingUpdate, ...update });
      return newMap;
    });
  }, []);

  const setOptimisticCutoff = useCallback((messageId: string | null) => {
    if (messageId) {
      const convexUiMessages = convexMessages?.map(convexMessageToUiMessage) ?? [];
      const cutoffIndex = convexUiMessages.findIndex(m => m.id === messageId);
      if (cutoffIndex !== -1) {
        setOptimisticMessageCache(convexUiMessages.slice(0, cutoffIndex + 1));
      }
    } else {
      setOptimisticMessageCache(null);
    }
  }, [convexMessages]);
  
  const clearOptimisticState = useCallback(() => {
    setOptimisticUpdates(new Map());
    setOptimisticMessageCache(null);
  }, []);

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
    initialMessages: [],
    sendExtraMessageFields: true,
    generateId: idGenerator.next,
    experimental_prepareRequestBody({ messages }) {
      const modelToUse = overrideModelRef.current?.modelId || selectedModelId;
      const paramsToUse = overrideModelRef.current?.params || modelParams;
      overrideModelRef.current = null;
      
      const requestBody: any = { 
        message: messages[messages.length - 1], 
        threadId,
        selectedModelId: modelToUse,
        modelParams: paramsToUse,
        attachmentIds: attachmentIdsRef.current,
      };

      if (nextAssistantStreamIdRef.current) {
        requestBody.assistantClientId = nextAssistantStreamIdRef.current;
        nextAssistantStreamIdRef.current = null;
      }

      return requestBody;
    },
  });

  const messages: ChatMessage[] = useMemo(() => {
    const baseMessages = optimisticMessageCache 
      ? optimisticMessageCache 
      : (convexMessages?.map(convexMessageToUiMessage) ?? []);
    
    // If we are in a retry/edit state, only accept assistant messages from the AI SDK state
    const uiMessages = optimisticMessageCache 
      ? (aiMessages as ChatMessage[]).filter(m => m.role === 'assistant')
      : (aiMessages as ChatMessage[]);
    
    const messageMap = new Map<string, ChatMessage>();

    for (const msg of baseMessages) {
      messageMap.set(msg.id, msg);
    }
    
    for (const uiMsg of uiMessages) {
      const matchingConvexMsg = convexMessages?.find(
        (convexMsg) => convexMsg._id === uiMsg.id || convexMsg.clientId === uiMsg.id
      );

      if (matchingConvexMsg) {
        const mergedMsg = {
          ...convexMessageToUiMessage(matchingConvexMsg),
          ...uiMsg,
          id: matchingConvexMsg._id, 
        };
        messageMap.set(mergedMsg.id, mergedMsg);
      } else {
        messageMap.set(uiMsg.id, uiMsg);
      }
    }

    const combinedMessages = Array.from(messageMap.values());

    combinedMessages.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (!aDate || !bDate) return 0;
      return aDate - bDate;
    });

    const finalMessages = combinedMessages.map(msg => {
      const optimisticUpdate = optimisticUpdates.get(msg.id);
      if (optimisticUpdate) {
        return { ...msg, ...optimisticUpdate };
      }
      return msg;
    });

    return finalMessages;
  }, [aiMessages, convexMessages, optimisticMessageCache, optimisticUpdates]);

  const handleSubmit = useCallback((
    e: React.FormEvent<HTMLFormElement>,
    attachmentIds: Id<'attachments'>[] = []
  ) => {
    nextAssistantStreamIdRef.current = idGenerator.peek(1);
    attachmentIdsRef.current = attachmentIds;
    originalHandleSubmit(e);
  }, [originalHandleSubmit, idGenerator]);

  const append = useCallback(async (
    message: Message | CreateMessage,
    options?: { 
      attachmentIds?: Id<'attachments'>[];
      modelId?: SupportedModelId;
      modelParams?: ModelParams;
    }
  ) => {
    nextAssistantStreamIdRef.current = idGenerator.peek(1);
    
    if (options?.attachmentIds) {
      attachmentIdsRef.current = options.attachmentIds;
    }
    if (options?.modelId) {
      overrideModelRef.current = {
        modelId: options.modelId,
        params: options.modelParams || modelParams
      };
    }

    return chatHelpers.append(message);
  }, [chatHelpers, modelParams, idGenerator]);

  const isStreaming = useMemo(() => {
    return status === "streaming" || convexMessages?.some(message => message.status === "streaming") || false;
  }, [status, convexMessages]);

  const prevIsStreaming = useRef(isStreaming);

  useEffect(() => {
    // `convexMessages` will soon be updated with the complete message.
    // Once there are no more streaming messages in Convex, we can clear
    // the messages in the AI SDK state to prevent duplicates.
    const streamingHasStopped = convexMessages?.every(m => m.status !== 'streaming');

    if (prevIsStreaming.current && !isStreaming && streamingHasStopped) {
      setMessages([]);
      clearOptimisticState();
    }

    prevIsStreaming.current = isStreaming;
  }, [isStreaming, convexMessages, setMessages, clearOptimisticState]);

  useAutoResume({
    autoResume: true,
    experimental_resume,
    threadId: threadId || '',
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
    applyOptimisticUpdate,
    setOptimisticCutoff,
  };
}
