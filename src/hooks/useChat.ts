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
  const attachmentIdsRef = useRef<Id<'attachments'>[]>([]);
  const overrideModelRef = useRef<{ modelId: SupportedModelId; params: ModelParams } | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<ChatMessage>>>(new Map());
  const [optimisticCutoffId, setOptimisticCutoffId] = useState<string | null>(null);

  const applyOptimisticUpdate = useCallback((messageId: string, update: Partial<ChatMessage>) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      const existingUpdate = newMap.get(messageId) || {};
      newMap.set(messageId, { ...existingUpdate, ...update });
      return newMap;
    });
  }, []);

  const setOptimisticCutoff = useCallback((messageId: string | null) => {
    setOptimisticCutoffId(messageId);
  }, []);
  
  const clearOptimisticState = useCallback(() => {
    setOptimisticUpdates(new Map());
    setOptimisticCutoffId(null);
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
    const convexUiMessages = convexMessages?.map(convexMessageToUiMessage) ?? [];
    
    // `aiMessages` contains messages from the current `useChat` interaction,
    // which are not yet finalized in Convex. This includes the user's latest
    // message and the assistant's streaming response.
    const newMessages = (aiMessages as ChatMessage[]).filter(aiMsg => {
      if (aiMsg.role === 'user') {
        // Include user message if it's not yet in Convex (matched by client ID)
        return !convexMessages?.some(convexMsg => convexMsg.clientId === aiMsg.id);
      }
      if (aiMsg.role === 'assistant') {
        // Assistant messages are handled by replacing the streaming placeholder.
        return true;
      }
      return false;
    });

    let baseMessages = [...convexUiMessages];

    const assistantMessage = newMessages.find(m => m.role === 'assistant');
    if (assistantMessage) {
      const streamingConvexMsgIndex = baseMessages.findIndex(m => m.status === 'streaming');
      if (streamingConvexMsgIndex !== -1) {
        const convexStreamingMessage = baseMessages[streamingConvexMsgIndex];
        // Replace the placeholder from Convex with the live streaming message
        // from the AI SDK, preserving the permanent ID and other fields.
        baseMessages[streamingConvexMsgIndex] = {
          ...convexStreamingMessage,
          ...assistantMessage,
          id: convexStreamingMessage.id,
        } as ChatMessage;

        // Add user message if it's not in convex yet
        const userMessage = newMessages.find(m => m.role === 'user');
        if (userMessage) {
          baseMessages.push(userMessage);
        }
      } else {
        baseMessages.push(...newMessages);
      }
    } else {
      baseMessages.push(...newMessages);
    }
    
    // Apply optimistic cutoff
    if (optimisticCutoffId) {
        const cutoffIndex = baseMessages.findIndex(m => m.id === optimisticCutoffId);
        if (cutoffIndex !== -1) {
            baseMessages = baseMessages.slice(0, cutoffIndex + 1);
        }
    }

    // Apply optimistic updates
    const finalMessages = baseMessages.map(msg => {
        const optimisticUpdate = optimisticUpdates.get(msg.id);
        if (optimisticUpdate) {
            return { ...msg, ...optimisticUpdate };
        }
        return msg;
    });

    return finalMessages;
  }, [aiMessages, convexMessages, optimisticUpdates, optimisticCutoffId]);

  const handleSubmit = useCallback((
    e: React.FormEvent<HTMLFormElement>,
    attachmentIds: Id<'attachments'>[] = []
  ) => {
    attachmentIdsRef.current = attachmentIds;
    originalHandleSubmit(e);
  }, [originalHandleSubmit]);

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

    return chatHelpers.append(message);
  }, [chatHelpers, modelParams]);

  const isStreaming = useMemo(() => {
    return status === "streaming" || convexMessages?.some(message => message.status === "streaming") || false;
  }, [status, convexMessages]);

  const prevIsStreaming = useRef(isStreaming);

  useEffect(() => {
    // When a stream finishes, `isStreaming` goes from true to false.
    // `convexMessages` will soon be updated with the complete message.
    // Once there are no more streaming messages in Convex, we can clear
    // the messages in the AI SDK state to prevent duplicates.
    const allMessagesCompleted = convexMessages?.every(m => m.status === 'completed');

    if (prevIsStreaming.current && !isStreaming && allMessagesCompleted) {
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
