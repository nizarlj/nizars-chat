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
import { type AttachmentData } from '@/types/attachments';

type ConvexMessagesWithAttachments = FunctionReturnType<typeof api.messages.getThreadMessages>;
type ConvexMessage = ConvexMessagesWithAttachments[number];

type ChatRequestBody = {
  message: Message;
  threadId?: Id<'threads'>;
  selectedModelId: SupportedModelId;
  modelParams: ModelParams;
  attachmentIds: Id<'attachments'>[];
  assistantClientId?: string;
};

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

function createOptimisticAttachments(attachmentData: AttachmentData[]) {
  return attachmentData.map(attachment => ({
    name: attachment.fileName,
    contentType: attachment.mimeType,
    url: attachment.url || (attachment.file ? URL.createObjectURL(attachment.file) : ""),
  }));
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
  const [optimisticCutoffMessageId, setOptimisticCutoffMessageId] = useState<string | null>(null);
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
    setOptimisticCutoffMessageId(messageId);
  }, []);
  
  const clearOptimisticState = useCallback(() => {
    setOptimisticUpdates(new Map());
    setOptimisticCutoffMessageId(null);
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
      
      const requestBody: ChatRequestBody = { 
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
    let baseMessages = convexMessages?.map(convexMessageToUiMessage) ?? [];
    
    // Apply cutoff if specified - only show messages up to the cutoff point
    if (optimisticCutoffMessageId) {
      const cutoffIndex = baseMessages.findIndex(m => m.id === optimisticCutoffMessageId);
      if (cutoffIndex !== -1) {
        baseMessages = baseMessages.slice(0, cutoffIndex);
      }
    }
    
    // Merge AI SDK messages (for streaming and optimistic updates)
    const uiMessages = aiMessages as ChatMessage[];
    const messageMap = new Map<string, ChatMessage>();

    // Start with base messages from Convex
    for (const msg of baseMessages) {
      messageMap.set(msg.id, msg);
    }
    
    // Add or enhance with UI messages
    for (const uiMsg of uiMessages) {
      const matchingConvexMsg = convexMessages?.find(
        (convexMsg) => convexMsg._id === uiMsg.id || convexMsg.clientId === uiMsg.id
      );

      if (matchingConvexMsg) {
        // Convex message exists - merge but prioritize Convex data
        const convexUiMsg = convexMessageToUiMessage(matchingConvexMsg);
        const mergedMsg = {
          ...uiMsg,
          ...convexUiMsg,
          id: matchingConvexMsg._id,
          ...(uiMsg.content && uiMsg.content.length > (convexUiMsg.content?.length || 0) && {
            content: uiMsg.content
          }),
          ...(uiMsg.parts && uiMsg.parts.length > 0 && {
            parts: uiMsg.parts
          })
        };
        messageMap.set(mergedMsg.id, mergedMsg);
      } else {
        // No Convex match - use UI message as-is (optimistic)
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

    // Apply optimistic updates
    const finalMessages = combinedMessages.map(msg => {
      const optimisticUpdate = optimisticUpdates.get(msg.id);
      if (optimisticUpdate) {
        return { ...msg, ...optimisticUpdate };
      }
      return msg;
    });

    return finalMessages;
  }, [aiMessages, convexMessages, optimisticCutoffMessageId, optimisticUpdates]);

  const handleSubmit = useCallback((
    e: React.FormEvent<HTMLFormElement>,
    attachmentIds: Id<'attachments'>[] = [],
    attachmentData?: AttachmentData[]
  ) => {
    nextAssistantStreamIdRef.current = idGenerator.peek(1);
    attachmentIdsRef.current = attachmentIds;
    
    // Add optimistic attachments if provided
    if (attachmentData && attachmentData.length > 0) {
      const optimisticAttachments = createOptimisticAttachments(attachmentData);
      originalHandleSubmit(e, {
        allowEmptySubmit: true,
        experimental_attachments: optimisticAttachments,
      });
    } else {
      originalHandleSubmit(e, {
        allowEmptySubmit: true,
      });
    }
  }, [originalHandleSubmit, idGenerator]);

  const append = useCallback(async (
    message: Message | CreateMessage,
    options?: { 
      attachmentIds?: Id<'attachments'>[];
      modelId?: SupportedModelId;
      modelParams?: ModelParams;
      attachmentData?: AttachmentData[];
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

    // Add optimistic attachments if provided
    let messageWithAttachments = message;
    if (options?.attachmentData && options.attachmentData.length > 0) {
      const optimisticAttachments = createOptimisticAttachments(options.attachmentData);
      messageWithAttachments = {
        ...message,
        experimental_attachments: optimisticAttachments,
      };
    }

    return chatHelpers.append(messageWithAttachments);
  }, [chatHelpers, modelParams, idGenerator]);

  const isStreaming = useMemo(() => {
    return status === "streaming" || convexMessages?.some(message => message.status === "streaming") || false;
  }, [status, convexMessages]);

  const prevIsStreaming = useRef(isStreaming);

  useEffect(() => {
    const streamingHasStopped = convexMessages?.every(m => m.status !== 'streaming');

    if (prevIsStreaming.current && !isStreaming && streamingHasStopped) {
      const allUiMessagesSynced = aiMessages.every(uiMsg => 
        convexMessages?.some(convexMsg => 
          convexMsg._id === uiMsg.id || convexMsg.clientId === uiMsg.id
        )
      );
      
      if (allUiMessagesSynced) {
        setMessages([]);
        clearOptimisticState();
      }
    }

    prevIsStreaming.current = isStreaming;
  }, [isStreaming, convexMessages, setMessages, clearOptimisticState, aiMessages]);

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
