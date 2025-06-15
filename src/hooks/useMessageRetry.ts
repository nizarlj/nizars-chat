"use client";

import { useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { type Message } from 'ai';
import { SupportedModelId } from '@/lib/models';
import { type FunctionReturnType } from 'convex/server';

type ConvexMessages = FunctionReturnType<typeof api.messages.getThreadMessages>;

interface UseMessageRetryOptions {
  threadId: Id<"threads"> | undefined;
  isStreaming: boolean;
  selectedModelId: SupportedModelId;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  append: (message: Omit<Message, 'id'>, options?: { attachmentIds?: Id<'attachments'>[] }) => Promise<string | null | undefined>;
  selectModel: (modelId: SupportedModelId) => void;
  convexMessages: ConvexMessages | undefined;
}


function findUserMessageToResubmit(
  messageToRetry: Message, 
  messages: Message[]
): Message | null {
  if (messageToRetry.role === "user") {
    return messageToRetry;
  }

  if (messageToRetry.role === "assistant") {
    const messageIndex = messages.findIndex(m => m.id === messageToRetry.id);
    
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return messages[i];
      }
    }
  }

  return null;
}

function createResubmissionMessage(
  userMessage: Message
): Omit<Message, 'id'> {
  return {
    role: "user",
    content: userMessage.content,
    ...(userMessage.experimental_attachments && {
      experimental_attachments: userMessage.experimental_attachments
    })
  };
}

export function useMessageRetry({
  threadId,
  isStreaming,
  selectedModelId,
  messages,
  setMessages,
  append,
  selectModel,
  convexMessages,
}: UseMessageRetryOptions) {
  const deleteMessagesFrom = useMutation(api.messages.deleteMessagesFrom);

  const messagesRef = useRef(messages);
  const setMessagesRef = useRef(setMessages);
  const appendRef = useRef(append);
  const selectModelRef = useRef(selectModel);
  const convexMessagesRef = useRef(convexMessages);
  
  messagesRef.current = messages;
  setMessagesRef.current = setMessages;
  appendRef.current = append;
  selectModelRef.current = selectModel;
  convexMessagesRef.current = convexMessages;

  const handleRetry = useCallback(async (
    messageToRetry: Message, 
    retryModelId?: SupportedModelId
  ): Promise<void> => {
    if (!threadId || isStreaming) {
      return;
    }

    if (!["user", "assistant"].includes(messageToRetry.role)) {
      return;
    }

    try {
      const currentMessages = messagesRef.current;
      const userMessageToResubmit = findUserMessageToResubmit(messageToRetry, currentMessages);
      
      if (!userMessageToResubmit) {
        console.error("No user message found to retry");
        return;
      }

      const currentConvexMessages = convexMessagesRef.current;
      const convexMessage = currentConvexMessages?.find(m => m._id === userMessageToResubmit.id);
      const attachmentIds = convexMessage?.attachmentIds ?? [];

      await deleteMessagesFrom({
        threadId,
        messageId: userMessageToResubmit.id as Id<"messages">,
        includeMessage: true,
      });

      if (retryModelId && retryModelId !== selectedModelId) {
        selectModelRef.current(retryModelId);
      }

      const userMessageIndex = currentMessages.findIndex(m => m.id === userMessageToResubmit.id);
      const updatedMessages = currentMessages.slice(0, userMessageIndex);
      setMessagesRef.current(updatedMessages);

      const resubmissionMessage = createResubmissionMessage(userMessageToResubmit);
      await appendRef.current(resubmissionMessage, { attachmentIds });

    } catch (error) {
      console.error("Failed to retry message:", error);
    }
  }, [
    threadId,
    isStreaming,
    selectedModelId,
    deleteMessagesFrom
  ]);

  return {
    handleRetry,
  };
} 