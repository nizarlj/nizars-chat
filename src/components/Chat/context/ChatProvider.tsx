"use client";

import { useRouterNavigation } from "@/hooks/useRouterNavigation";
import { Id } from "@convex/_generated/dataModel";
import { useResumableChat } from "@/hooks/useChat";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useModel } from "@/hooks/useModel";
import { useThreadModelSync } from "@/hooks/useThreadModelSync";
import { useMessageResubmit } from "@/hooks/useMessageResubmit";
import { useThreads } from "@/hooks/useThreads";
import { SupportedModelId } from "@/lib/models";
import { type Message } from "ai";
import { ReasoningUIPart } from '@ai-sdk/ui-utils';
import { 
  ChatAttachmentsProvider,
  useChatAttachments,
  ChatMessagesContext, 
  ChatThreadContext, 
  ChatConfigContext,
  type ChatMessagesContextType,
  type ChatThreadContextType,
  type ChatConfigContextType
} from ".";
import { type AttachmentData } from "@/types/attachments";

// Export handlers type for use in ChatLayout
export type ChatHandlers = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent, attachmentIds: Id<'attachments'>[], attachmentData?: AttachmentData[]) => void;
  handleRetry: (messageToRetry: Message, retryModelId?: SupportedModelId) => void;
  handleEdit: (
    messageToEdit: Message, 
    newContent: string, 
    finalAttachmentIds: Id<'attachments'>[],
    attachmentData?: AttachmentData[]
  ) => void;
  isStreaming: boolean;
  stop: () => void;
  setOptimisticCutoff: (messageId: string | null) => void;
};

interface ChatProviderProps {
  children: React.ReactNode | ((handlers: ChatHandlers) => React.ReactNode);
  threadId?: Id<"threads">;
  isNewChat?: boolean;
}

type DataPart = 
  | { type: 'thread-created'; id: string }
  | { type: 'stream-started'; streamId: string }
  | { type: 'error'; error: string }
  | { type: 'other' };

function ChatProviderInner({ children, threadId, isNewChat = false }: ChatProviderProps) {
  const { navigateInstantly } = useRouterNavigation();
  const { isAuthenticated } = useConvexAuth();
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const navigatedToThreadRef = useRef<string | null>(null);
  
  // Reset navigation tracking when we're in a new chat
  useEffect(() => {
    if (isNewChat) {
      navigatedToThreadRef.current = null;
    }
  }, [isNewChat]);
  
  const { 
    selectedModelId,
    selectedModel,
    modelParams, 
    selectModel, 
    syncWithThread,
    updateParam, 
    resetParams,
    lastThreadModel,
  } = useModel();
  
  const { clearAttachments } = useChatAttachments();
  const { branchThread } = useThreads();
  
  // Fetch initial messages only if a threadId is provided
  const convexMessages = useQuery(
    api.messages.getThreadMessages,
    threadId && isAuthenticated ? { threadId } : "skip"
  );

  // When loading a thread, check if the last message was streaming and grab its streamId
  useEffect(() => {
    if (convexMessages && convexMessages.length > 0) {
      const lastMessage = convexMessages.findLast(m => m.role === "assistant" && m.status === "streaming" && m.streamId);
      if (lastMessage && lastMessage.streamId) setCurrentStreamId(lastMessage.streamId);
    }
  }, [convexMessages]);

  // Fetch thread data if threadId is provided
  const thread = useQuery(
    api.threads.getThread,
    threadId ? { threadId } : "skip"
  );

  // Handle thread-model synchronization
  useThreadModelSync({
    threadId,
    thread,
    selectedModelId,
    lastThreadModel,
    syncWithThread,
  });

  const {
    messages,
    input,
    handleInputChange: resumableHandleInputChange,
    handleSubmit: resumableHandleSubmit,
    append,
    data,
    isStreaming,
    stop: clientStop,
    applyOptimisticUpdate,
    setOptimisticCutoff,
    clearOptimisticState,
  } = useResumableChat({
    threadId,
    convexMessages,
    selectedModelId: selectedModelId,
    modelParams,
  });


  // Create stable versions of handlers to prevent ChatInput re-renders
  const handleSubmitRef = useRef(resumableHandleSubmit);
  useEffect(() => { handleSubmitRef.current = resumableHandleSubmit; }, [resumableHandleSubmit]);
  
  const handleInputChangeRef = useRef(resumableHandleInputChange);
  useEffect(() => { handleInputChangeRef.current = resumableHandleInputChange; }, [resumableHandleInputChange]);

  const handleSubmit = useCallback((e: React.FormEvent, attachmentIds: Id<'attachments'>[], attachmentData?: AttachmentData[]) => {
    handleSubmitRef.current(e as React.FormEvent<HTMLFormElement>, attachmentIds, attachmentData);
    clearAttachments();
  }, [clearAttachments]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChangeRef.current(e);
  }, []);

  const { handleRetry, handleEdit } = useMessageResubmit({
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
  });

  const handleBranch = useCallback(async (message: Message) => {
    if (!threadId) return;
    
    try {
      const newThreadId = await branchThread(threadId, message.id);
      navigateInstantly(`/thread/${newThreadId}`);
    } catch (error) {
      console.error('Failed to branch thread:', error);
    }
  }, [threadId, branchThread, navigateInstantly]);

  // Effect to handle data parts from the stream (thread creation, stream ID)
  useEffect(() => {
    if (!data || data.length === 0) return;

    for (const part of data) {
      const dataPart = part as DataPart;
      if (dataPart.type === 'thread-created' && dataPart.id !== threadId && isNewChat) {
        // Only navigate if we haven't already navigated to this thread
        if (navigatedToThreadRef.current !== dataPart.id) {
          navigatedToThreadRef.current = dataPart.id;
          navigateInstantly(`/thread/${dataPart.id}`);
        }
      }
      if (dataPart.type === 'stream-started' && dataPart.streamId) {
        setCurrentStreamId(dataPart.streamId);
      }
    }
  }, [data, navigateInstantly, threadId, isNewChat]);

  const handleStop = useCallback(() => {
    const streamingMessage = messages.find(m => m.status === 'streaming');
    const streamIdToStop = streamingMessage?.streamId || currentStreamId;
    if (!streamIdToStop) return;

    // 1. Optimistically update the UI to show the stopped state
    if (streamingMessage) {
      applyOptimisticUpdate(streamingMessage.id, {
        status: 'error',
        error: 'Stopped by user',
      });
    }

    const reasoningPart = streamingMessage?.parts?.find(
      (part): part is ReasoningUIPart => part.type === 'reasoning'
    );
    const reasoning = reasoningPart?.reasoning;

    // 2. Tell the server to gracefully stop the stream AND
    //    guarantee the database status change with the partial content
    fetch('/api/chat/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        streamId: streamIdToStop,
        content: streamingMessage?.content || "",
        reasoning
      }),
    });
    
    // 3. Stop the client-side Vercel AI SDK processing
    clientStop();
  }, [
    currentStreamId, 
    clientStop, 
    messages, 
    applyOptimisticUpdate
  ]);

  const isLoadingMessages = Boolean(
    !isNewChat && threadId && (
      convexMessages === undefined || 
      thread === undefined ||
      (thread && messages.length === 0 && !isStreaming)
    )
  );

  // Context values - clear messages during instant navigation
  const messagesContextValue: ChatMessagesContextType = useMemo(() => ({
    messages: messages, 
    isLoadingMessages: isLoadingMessages,
    isStreaming,
    handleRetry,
    handleEdit,
    convexMessages,
    handleBranch,
  }), [messages, isLoadingMessages, isStreaming, handleRetry, handleEdit, convexMessages, handleBranch]);

  const threadContextValue: ChatThreadContextType = useMemo(() => ({
    thread,
  }), [thread]);

  const configContextValue: ChatConfigContextType = useMemo(() => ({
    selectedModel,
    modelParams,
    selectModel,
    updateParam,
    resetParams,
  }), [selectedModel, modelParams, selectModel, updateParam, resetParams]);

  // Expose handlers for ChatLayout to use
  const chatHandlers = useMemo(() => ({
    input,
    handleInputChange,
    handleSubmit,
    handleRetry,
    handleEdit,
    isStreaming,
    stop: handleStop,
    setOptimisticCutoff,
  }), [input, handleInputChange, handleSubmit, handleRetry, handleEdit, isStreaming, handleStop, setOptimisticCutoff]);

  return (
    <ChatMessagesContext.Provider value={messagesContextValue}>
      <ChatThreadContext.Provider value={threadContextValue}>
        <ChatConfigContext.Provider value={configContextValue}>
          {typeof children === 'function' ? children(chatHandlers) : children}
        </ChatConfigContext.Provider>
      </ChatThreadContext.Provider>
    </ChatMessagesContext.Provider>
  );
}

export default function ChatProvider({ children, threadId, isNewChat }: ChatProviderProps) {
  return (
    <ChatAttachmentsProvider>
      <ChatProviderInner threadId={threadId} isNewChat={isNewChat}>
        {children}
      </ChatProviderInner>
    </ChatAttachmentsProvider>
  );
} 