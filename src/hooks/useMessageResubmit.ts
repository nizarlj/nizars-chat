"use client";

import { useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { type Message } from 'ai';
import { SupportedModelId } from '@/lib/models';
import { type FunctionReturnType } from 'convex/server';
import { ModelParams } from '@convex/schema';
import { type AttachmentData, type ConvexAttachment } from '@/types/attachments';

type ConvexMessages = FunctionReturnType<typeof api.messages.getThreadMessages>;

interface UseMessageResubmitOptions {
  threadId: Id<"threads"> | undefined;
  isStreaming: boolean;
  selectedModelId: SupportedModelId;
  modelParams: ModelParams;
  messages: Message[];
  append: (
    message: Omit<Message, 'id'>, 
    options?: { 
      attachmentIds?: Id<'attachments'>[];
      modelId?: SupportedModelId;
      modelParams?: ModelParams;
      attachmentData?: AttachmentData[];
    }
  ) => Promise<string | null | undefined>;
  selectModel: (modelId: SupportedModelId) => void;
  convexMessages: ConvexMessages | undefined;
  setOptimisticCutoff: (messageId: string | null) => void;
  clearOptimisticState: () => void;
}

interface ResubmitOptions {
  newContent?: string; // If provided, edit the content
  newModelId?: SupportedModelId; // If provided, change the model
  finalAttachmentIds?: Id<'attachments'>[]; // If provided, use these attachment IDs
  attachmentData?: AttachmentData[]; // Rich attachment data for immediate display
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
  attachments: ConvexAttachment[],
  attachmentData?: AttachmentData[],
  newContent?: string
): Omit<Message, 'id'> {
  const baseMessage: Omit<Message, 'id'> = {
    role: "user",
    content: newContent || userMessage.content,
  };

  // Prefer rich attachment data if available (from editor)
  if (attachmentData && attachmentData.length > 0) {
    baseMessage.experimental_attachments = attachmentData.map(attachment => ({
      name: attachment.fileName,
      contentType: attachment.mimeType,
      url: attachment.url || (attachment.file ? URL.createObjectURL(attachment.file) : ""),
    }));
  } 
  // Otherwise use convex attachment data
  else if (attachments && attachments.length > 0) {
    baseMessage.experimental_attachments = attachments.map(attachment => ({
      name: attachment.fileName,
      contentType: attachment.mimeType,
      url: attachment.url || "", // Use empty string if no URL yet - loading state
    }));
  } 
  // Fallback to existing attachments
  else if (userMessage.experimental_attachments) {
    baseMessage.experimental_attachments = userMessage.experimental_attachments;
  }

  return baseMessage;
}

export function useMessageResubmit({
  threadId,
  isStreaming,
  selectedModelId,
  modelParams,
  messages,
  append,
  selectModel,
  convexMessages,
  setOptimisticCutoff,
  clearOptimisticState,
}: UseMessageResubmitOptions) {
  const deleteMessagesForResubmit = useMutation(api.messages.deleteMessagesForResubmit);

  const threadIdRef = useRef(threadId);
  const isStreamingRef = useRef(isStreaming);
  const selectedModelIdRef = useRef(selectedModelId);
  const messagesRef = useRef(messages);
  const appendRef = useRef(append);
  const selectModelRef = useRef(selectModel);
  const convexMessagesRef = useRef(convexMessages);
  const modelParamsRef = useRef(modelParams);
  const setOptimisticCutoffRef = useRef(setOptimisticCutoff);
  const clearOptimisticStateRef = useRef(clearOptimisticState);
  
  threadIdRef.current = threadId;
  isStreamingRef.current = isStreaming;
  selectedModelIdRef.current = selectedModelId;
  messagesRef.current = messages;
  appendRef.current = append;
  selectModelRef.current = selectModel;
  convexMessagesRef.current = convexMessages;
  modelParamsRef.current = modelParams;
  setOptimisticCutoffRef.current = setOptimisticCutoff;
  clearOptimisticStateRef.current = clearOptimisticState;

  const handleResubmit = useCallback((
    messageToResubmit: Message, 
    options: ResubmitOptions = {}
  ): void => {
    (async () => {
      if (!threadIdRef.current || isStreamingRef.current) {
        return;
      }

      const { newContent, newModelId, finalAttachmentIds, attachmentData } = options;

      // For edit operations, only allow user messages
      if (newContent !== undefined && messageToResubmit.role !== "user") {
        console.error("Only user messages can be edited");
        return;
      }

      // For edit operations, require content or attachments
      if (newContent !== undefined && !newContent.trim() && (!finalAttachmentIds || finalAttachmentIds.length === 0)) {
        console.error("Message must have content or attachments");
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
        clearOptimisticStateRef.current();
        setOptimisticCutoffRef.current(userMessageToResubmit.id);

        let attachmentIds: Id<'attachments'>[];
        let attachments: ConvexAttachment[] = [];
        
        if (finalAttachmentIds !== undefined) {
          attachmentIds = finalAttachmentIds;
          // For edits use original message's experimental_attachments for immediate display
          const originalAttachments = userMessageToResubmit.experimental_attachments || [];
          const currentConvexMessages = convexMessagesRef.current;
          
          attachments = finalAttachmentIds.map((id, index) => {
            // First try to find in convex messages
            if (currentConvexMessages) {
              const allAttachments = currentConvexMessages.flatMap(m => m.attachments || []);
              const found = allAttachments.find(a => a._id === id);
              if (found) return found;
            }
            
            // Fall back to original message data
            const originalAttachment = originalAttachments[index];
            return {
              _id: id,
              fileName: originalAttachment?.name || `attachment-${id}`,
              mimeType: originalAttachment?.contentType || 'application/octet-stream',
              url: '',
            };
          });
        } else {
          const currentConvexMessages = convexMessagesRef.current;
          const convexMessage = currentConvexMessages?.find(m => m._id === userMessageToResubmit.id);
          attachmentIds = convexMessage?.attachmentIds ?? [];
          attachments = convexMessage?.attachments ?? [];
        }

        const resubmissionMessage = createResubmissionMessage(userMessageToResubmit, attachments, attachmentData, newContent);
        
        const appendOptions: Parameters<typeof appendRef.current>[1] = {
          attachmentIds,
          attachmentData
        };
        
        if (newModelId && newModelId !== selectedModelIdRef.current) {
          appendOptions.modelId = newModelId;
          appendOptions.modelParams = modelParamsRef.current;
          selectModelRef.current(newModelId);
        }
        
        // First append the new message
        const beforeAppendTimestamp = Date.now();
        appendRef.current(resubmissionMessage, appendOptions);
        
        // Delete the old messages but preserve messages created after our append
        deleteMessagesForResubmit({
          threadId: threadIdRef.current!,
          fromMessageId: userMessageToResubmit.id as Id<"messages">,
          includeFromMessage: true,
          preserveAfterTimestamp: beforeAppendTimestamp,
        });

      } catch (error) {
        console.error("Failed to resubmit message:", error);
      }
    })();
  }, [deleteMessagesForResubmit]);

  const handleRetry = useCallback((
    messageToRetry: Message, 
    retryModelId?: SupportedModelId
  ): void => {
    return handleResubmit(messageToRetry, { newModelId: retryModelId });
  }, [handleResubmit]);

  const handleEdit = useCallback((
    messageToEdit: Message, 
    newContent: string,
    finalAttachmentIds: Id<'attachments'>[],
    attachmentData?: AttachmentData[]
  ): void => {
    return handleResubmit(messageToEdit, { newContent, finalAttachmentIds, attachmentData });
  }, [handleResubmit]);

  return {
    handleResubmit,
    handleRetry,
    handleEdit,
  };
} 