"use client";

import { useRouterNavigation } from "@/hooks/useRouterNavigation";
import { useParams } from "react-router-dom";
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

interface ChatProviderProps {
  children: React.ReactNode | ((handlers: ChatHandlers) => React.ReactNode);
}

type DataPart = 
  | { type: 'thread-created'; id: string }
  | { type: 'stream-started'; streamId: string }
  | { type: 'error'; error: string }
  | { type: 'other' };

function ChatProviderInner({ children }: ChatProviderProps) {
  const { navigateInstantly } = useRouterNavigation();
  const { isAuthenticated } = useConvexAuth();
  const { threadId: urlThreadId } = useParams<{ threadId: string }>();
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  
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
  
  // Extract threadId from URL params
  const threadId = useMemo(() => {
    return urlThreadId ? urlThreadId as Id<"threads"> : undefined;
  }, [urlThreadId]);

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
  } = useResumableChat({
    threadId,
    convexMessages,
    selectedModelId: selectedModelId,
    modelParams,
  });

  // Stop client-side streaming when the thread changes to prevent UI contamination
  useEffect(() => {
    return () => {
      if (isStreaming) clientStop();
    };
  }, [threadId, isStreaming, clientStop]);

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
      if (dataPart.type === 'thread-created' && dataPart.id !== threadId) {
        navigateInstantly(`/thread/${dataPart.id}`);
      }
      if (dataPart.type === 'stream-started' && dataPart.streamId) {
        setCurrentStreamId(dataPart.streamId);
      }
    }
  }, [data, navigateInstantly, threadId]);

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
    threadId && (
      convexMessages === undefined || 
      thread === undefined ||
      (thread && messages.length === 0)
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

export default function ChatProvider({ children }: ChatProviderProps) {
  return (
    <ChatAttachmentsProvider>
      <ChatProviderInner>
        {children}
      </ChatProviderInner>
    </ChatAttachmentsProvider>
  );
}

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