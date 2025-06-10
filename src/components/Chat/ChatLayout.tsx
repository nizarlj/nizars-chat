"use client";

import { useParams, useRouter } from "next/navigation";
import { Id } from "@convex/_generated/dataModel";
import { useResumableChat } from "@/hooks/useChat";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, createContext, useContext } from "react";
import { DataPart } from "@/hooks/use-auto-resume";
import ChatInput from "./ChatInput";
import { type Message } from "ai";
import { Doc } from "@convex/_generated/dataModel";
import { useModel, ModelParams } from "@/hooks/useModel";
import { getDefaultModel, Model, SupportedModelId } from "@/lib/models";

type ChatMessage = Message & { metadata?: Doc<"messages">["metadata"] };

interface ChatContextType {
  messages: ChatMessage[];
  isStreaming: boolean;
  selectedModel: Model;
  modelParams: ModelParams;
  selectModel: (modelId: SupportedModelId) => void;
  updateParam: <K extends keyof ModelParams>(key: K, value: ModelParams[K]) => void;
  resetParams: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    return { 
      messages: [], 
      isStreaming: false,
      selectedModel: getDefaultModel(),
      modelParams: {},
      selectModel: () => {},
      updateParam: () => {},
      resetParams: () => {},
    };
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
  const threadId = params?.threadId as Id<"threads"> | undefined;

  // Fetch initial messages only if a threadId is provided
  const convexMessages = useQuery(
    api.messages.getThreadMessages,
    threadId ? { threadId } : "skip"
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    data,
    isStreaming,
  } = useResumableChat({
    threadId,
    convexMessages,
    selectedModelId: selectedModelId,
    modelParams
  });

  // Effect to navigate to a new thread when created
  useEffect(() => {
    if (!data || data.length === 0) return;
    const dataPart = data[0] as DataPart;

    if (dataPart.type === 'thread-created' && dataPart.id !== threadId) {
      router.push(`/thread/${dataPart.id}`);
    }
  }, [data, router, threadId]);

  return (
    <ChatContext.Provider value={{ 
      messages, 
      isStreaming, 
      selectedModel,
      modelParams,
      selectModel,
      updateParam,
      resetParams,
    }}>
      <div className="flex-1">
        {children}
      </div>

      <div className="px-4 sticky bottom-0">
        <ChatInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          isDisabled={isStreaming}
        />
      </div>
    </ChatContext.Provider>
  );
}

export { ChatContext }; 