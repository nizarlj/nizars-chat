"use client";

import { useParams, useRouter } from "next/navigation";
import { Id } from "@convex/_generated/dataModel";
import { useResumableChat } from "@/hooks/useChat";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, createContext, useContext, useMemo, useRef, useCallback } from "react";
import { DataPart } from "@/hooks/use-auto-resume";
import ChatInput from "./ChatInput";
import { type Message } from "ai";
import { Doc } from "@convex/_generated/dataModel";
import { useModel, DEFAULT_MODEL_PARAMS } from "@/hooks/useModel";
import { ModelParams } from "@convex/schema";
import { getDefaultModel, Model, SupportedModelId } from "@/lib/models";

type ChatMessage = Message & { metadata?: Doc<"messages">["metadata"] };

interface ChatMessagesContextType {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isStreaming: boolean;
}

interface ChatThreadContextType {
  thread?: Doc<"threads"> | null;
}

interface ChatConfigContextType {
  selectedModel: Model;
  modelParams: ModelParams;
  selectModel: (modelId: SupportedModelId) => void;
  updateParam: <K extends keyof ModelParams>(key: K, value: ModelParams[K]) => void;
  resetParams: () => void;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | null>(null);
const ChatThreadContext = createContext<ChatThreadContextType | null>(null);
const ChatConfigContext = createContext<ChatConfigContextType | null>(null);

export function useChatMessages() {
  const context = useContext(ChatMessagesContext);
  if (!context) {
    throw new Error("useChatMessages must be used within a ChatProvider");
  }
  return context;
}

export function useChatThread() {
  const context = useContext(ChatThreadContext);
  if (!context) {
    throw new Error("useChatThread must be used within a ChatProvider");
  }
  return context;
}

export function useChatConfig() {
  const context = useContext(ChatConfigContext);
  const defaultModel = useMemo(() => getDefaultModel(), []);
  
  if (!context) {
    return {
    selectedModel: defaultModel,
    modelParams: DEFAULT_MODEL_PARAMS,
    selectModel: () => {},
    updateParam: () => {},
    resetParams: () => {},
    }
  }
  return context;
}

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const { 
    selectedModelId,
    selectedModel,
    modelParams, 
    selectModel, 
    updateParam, 
    resetParams 
  } = useModel();
  
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
    modelParams
  });

  // Create stable versions of handlers to prevent ChatInput re-renders
  const handleSubmitRef = useRef(resumableHandleSubmit);
  useEffect(() => { handleSubmitRef.current = resumableHandleSubmit; }, [resumableHandleSubmit]);
  
  const handleInputChangeRef = useRef(resumableHandleInputChange);
  useEffect(() => { handleInputChangeRef.current = resumableHandleInputChange; }, [resumableHandleInputChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    handleSubmitRef.current(e);
  }, []);

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

  const messagesContextValue = useMemo(() => ({
    messages, 
    isLoadingMessages,
    isStreaming,
  }), [messages, isLoadingMessages, isStreaming]);

  const threadContextValue = useMemo(() => ({
    thread,
  }), [thread]);

  const configContextValue = useMemo(() => ({
    selectedModel,
    modelParams,
    selectModel,
    updateParam,
    resetParams,
  }), [selectedModel, modelParams, selectModel, updateParam, resetParams]);

  const memoizedChatInput = useMemo(() => (
    <ChatInput
      input={input}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      isDisabled={isStreaming}
    />
  ), [input, handleInputChange, handleSubmit, isStreaming]);

  return (
    <ChatMessagesContext.Provider value={messagesContextValue}>
      <ChatThreadContext.Provider value={threadContextValue}>
        <ChatConfigContext.Provider value={configContextValue}>
          <div className="flex-1">
            {children}
          </div>

          <div className="px-4 sticky bottom-0">
            {memoizedChatInput}
          </div>
        </ChatConfigContext.Provider>
      </ChatThreadContext.Provider>
    </ChatMessagesContext.Provider>
  );
}

export { ChatMessagesContext, ChatThreadContext, ChatConfigContext }; 