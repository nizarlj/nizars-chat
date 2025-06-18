"use client";

import { useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { type Message } from 'ai';
import { SupportedModelId } from '@/lib/models';
import { type FunctionReturnType } from 'convex/server';
import { ModelParams } from '@convex/schema';

type ConvexMessages = FunctionReturnType<typeof api.messages.getThreadMessages>;

interface UseMessageResubmitOptions {
  threadId: Id<"threads"> | undefined;
  isStreaming: boolean;
  selectedModelId: SupportedModelId;
  modelParams: ModelParams;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  append: (
    message: Omit<Message, 'id'>, 
    options?: { 
      attachmentIds?: Id<'attachments'>[];
      modelId?: SupportedModelId;
      modelParams?: ModelParams;
    }
  ) => Promise<string | null | undefined>;
  selectModel: (modelId: SupportedModelId) => void;
  convexMessages: ConvexMessages | undefined;
  setOptimisticCutoff: (messageId: string | null) => void;
}

interface ResubmitOptions {
  newContent?: string; // If provided, edit the content
  newModelId?: SupportedModelId; // If provided, change the model
  finalAttachmentIds?: Id<'attachments'>[]; // If provided, use these attachment IDs
}

function findUserMessageToResubmit(
  messageToResubmit: Message, 
  messages: Message[]
): Message | null {
  if (messageToResubmit.role === "user") {
    return messageToResubmit;
  }

  if (messageToResubmit.role === "assistant") {
    const messageIndex = messages.findIndex(m => m.id === messageToResubmit.id);
    
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return messages[i];
      }
    }
  }

  return null;
}

function createResubmissionMessage(
  userMessage: Message,
  newContent?: string
): Omit<Message, 'id'> {
  return {
    role: "user",
    content: newContent || userMessage.content,
    ...(userMessage.experimental_attachments && {
      experimental_attachments: userMessage.experimental_attachments
    })
  };
}

export function useMessageResubmit({
  threadId,
  isStreaming,
  selectedModelId,
  modelParams,
  messages,
  setMessages,
  append,
  selectModel,
  convexMessages,
  setOptimisticCutoff,
}: UseMessageResubmitOptions) {
  const deleteMessagesFrom = useMutation(api.messages.deleteMessagesFrom);

  const threadIdRef = useRef(threadId);
  const isStreamingRef = useRef(isStreaming);
  const selectedModelIdRef = useRef(selectedModelId);
  const messagesRef = useRef(messages);
  const appendRef = useRef(append);
  const selectModelRef = useRef(selectModel);
  const convexMessagesRef = useRef(convexMessages);
  const modelParamsRef = useRef(modelParams);
  const setOptimisticCutoffRef = useRef(setOptimisticCutoff);
  
  threadIdRef.current = threadId;
  isStreamingRef.current = isStreaming;
  selectedModelIdRef.current = selectedModelId;
  messagesRef.current = messages;
  appendRef.current = append;
  selectModelRef.current = selectModel;
  convexMessagesRef.current = convexMessages;
  modelParamsRef.current = modelParams;
  setOptimisticCutoffRef.current = setOptimisticCutoff;

  const handleResubmit = useCallback(async (
    messageToResubmit: Message, 
    options: ResubmitOptions = {}
  ): Promise<void> => {
    if (!threadIdRef.current || isStreamingRef.current) {
      return;
    }

    const { newContent, newModelId, finalAttachmentIds } = options;

    // For edit operations, only allow user messages
    if (newContent !== undefined && messageToResubmit.role !== "user") {
      console.error("Only user messages can be edited");
      return;
    }

    // For edit operations, require non-empty content
    if (newContent !== undefined && !newContent.trim()) {
      console.error("Message content cannot be empty");
      return;
    }

    if (!["user", "assistant"].includes(messageToResubmit.role)) {
      return;
    }

    try {
      const currentMessages = messagesRef.current;
      const userMessageToResubmit = findUserMessageToResubmit(messageToResubmit, currentMessages);
      
      if (!userMessageToResubmit) {
        console.error("No user message found to resubmit");
        return;
      }

      // Optimistically update the UI
      setOptimisticCutoffRef.current(userMessageToResubmit.id);

      let attachmentIds: Id<'attachments'>[];
      if (finalAttachmentIds !== undefined) {
        attachmentIds = finalAttachmentIds;
      } else {
        const currentConvexMessages = convexMessagesRef.current;
        const convexMessage = currentConvexMessages?.find(m => m._id === userMessageToResubmit.id);
        attachmentIds = convexMessage?.attachmentIds ?? [];
      }

      // Perform server-side deletion in the background
      await deleteMessagesFrom({
        threadId: threadIdRef.current,
        messageId: userMessageToResubmit.id as Id<"messages">,
        includeMessage: true,
      });

      const resubmissionMessage = createResubmissionMessage(userMessageToResubmit, newContent);
      
      const appendOptions: Parameters<typeof appendRef.current>[1] = {
        attachmentIds
      };
      
      if (newModelId && newModelId !== selectedModelIdRef.current) {
        appendOptions.modelId = newModelId;
        appendOptions.modelParams = modelParamsRef.current;
        selectModelRef.current(newModelId);
      }
      
      await appendRef.current(resubmissionMessage, appendOptions);

    } catch (error) {
      console.error("Failed to resubmit message:", error);
    }
  }, [deleteMessagesFrom]);

  const handleRetry = useCallback(async (
    messageToRetry: Message, 
    retryModelId?: SupportedModelId
  ): Promise<void> => {
    return handleResubmit(messageToRetry, { newModelId: retryModelId });
  }, [handleResubmit]);

  const handleEdit = useCallback(async (
    messageToEdit: Message, 
    newContent: string,
    finalAttachmentIds: Id<'attachments'>[]
  ): Promise<void> => {
    return handleResubmit(messageToEdit, { newContent, finalAttachmentIds });
  }, [handleResubmit]);

  return {
    handleResubmit,
    handleRetry,
    handleEdit,
  };
} 