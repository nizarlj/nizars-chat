"use client";

import { useParams, useRouter } from "next/navigation";
import { Id } from "@convex/_generated/dataModel";
import { useResumableChat } from "@/hooks/useChat";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { DataPart } from "@/hooks/use-auto-resume";
import { useModel } from "@/hooks/useModel";
import { useThreadModelSync } from "@/hooks/useThreadModelSync";
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

interface ChatProviderProps {
  children: React.ReactNode | ((handlers: ChatHandlers) => React.ReactNode);
}

function ChatProviderInner({ children }: ChatProviderProps) {
  const params = useParams();
  const router = useRouter();
  
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
  
  const { clearAttachments, clearCurrentAttachmentIds } = useChatAttachments();
  
  // Extract threadId from URL params if we're on a thread page
  const threadId = useMemo(() => 
    params?.threadId as Id<"threads"> | undefined, 
    [params?.threadId]
  );

  // Fetch initial messages only if a threadId is provided
  const convexMessages = useQuery(
    api.messages.getThreadMessages,
    threadId ? { threadId } : "skip"
  );

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
    data,
    isStreaming,
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

  const handleSubmit = useCallback((e: React.FormEvent, attachmentIds: Id<'attachments'>[]) => {
    handleSubmitRef.current(e as React.FormEvent<HTMLFormElement>, attachmentIds);
    clearAttachments();
    clearCurrentAttachmentIds();
  }, [clearAttachments, clearCurrentAttachmentIds]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChangeRef.current(e);
  }, []);

  // Effect to navigate to a new thread when created
  useEffect(() => {
    if (!data || data.length === 0) return;
    const dataPart = data[0] as DataPart;

    if (dataPart.type === 'thread-created' && dataPart.id !== threadId) {
      router.push(`/thread/${dataPart.id}`);
    }
  }, [data, router, threadId]);

  const isLoadingMessages = Boolean(
    threadId && (
      convexMessages === undefined || 
      thread === undefined ||
      (thread && messages.length === 0)
    )
  );

  // Context values
  const messagesContextValue: ChatMessagesContextType = useMemo(() => ({
    messages, 
    isLoadingMessages,
    isStreaming,
  }), [messages, isLoadingMessages, isStreaming]);

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
    isStreaming,
  }), [input, handleInputChange, handleSubmit, isStreaming]);

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
  handleSubmit: (e: React.FormEvent, attachmentIds: Id<'attachments'>[]) => void;
  isStreaming: boolean;
}; 