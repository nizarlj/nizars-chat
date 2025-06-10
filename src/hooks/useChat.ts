'use client';

import { useChat, type Message, type UseChatOptions } from '@ai-sdk/react';
import { useAutoResume } from './use-auto-resume';
import { Doc, Id } from '@convex/_generated/dataModel';
import { useEffect, useMemo, useState } from 'react';
import { SupportedModelId } from '@/lib/models';
import { ModelParams } from './useModel';

type UseResumableChatOptions = Omit<UseChatOptions, 'id'> & {
  threadId?: Id<'threads'>;
  convexMessages: Doc<"messages">[] | undefined;
  selectedModelId: SupportedModelId;
  modelParams: ModelParams;
};

export function useResumableChat({
  threadId,
  convexMessages,
  selectedModelId,
  modelParams,
  ...options
}: UseResumableChatOptions) {
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const initialMessages: Message[] = useMemo(() =>
    convexMessages?.map((msg) => ({
      id: msg._id,
      role: msg.role,
      content: msg.content ?? "",
      createdAt: new Date(msg.createdAt),
      ...(msg.metadata && { data: { metadata: msg.metadata } }),
    })) ?? [], [convexMessages]);

  const {
    messages,
    data,
    setMessages,
    experimental_resume,
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
        modelParams
      };
    },
  });

  const isStreaming = useMemo(() => {
    return convexMessages?.some(message => message.status !== "completed") || false;
  }, [convexMessages]);

  useEffect(() => {
    // Set messages when:
    // 1. Messages first load (convexMessages transitions from undefined to having a value)
    // 2. All messages are completed (no streaming in progress)
    const messagesJustLoaded = !messagesLoaded && convexMessages !== undefined;
    const allMessagesCompleted = convexMessages?.every(message => message.status === "completed");
    if (messagesJustLoaded || (convexMessages && allMessagesCompleted)) setMessages(initialMessages);
    
    // Update the state to track the current state for next render
    setMessagesLoaded(convexMessages !== undefined);
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
  };
}
