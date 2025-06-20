"use client";

import { createContext, useContext } from "react";
import { type Message } from "ai";
import { Id } from "@convex/_generated/dataModel";
import { SupportedModelId, ChatMessage } from "@/lib/models";
import { type FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { type AttachmentData } from "@/types/attachments";

type ConvexMessages = FunctionReturnType<typeof api.messages.getThreadMessages>;

interface ChatMessagesContextType {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isStreaming: boolean;
  handleRetry: (messageToRetry: Message, retryModelId?: SupportedModelId) => void;
  handleEdit: (
    messageToEdit: Message, 
    newContent: string, 
    finalAttachmentIds: Id<'attachments'>[],
    attachmentData?: AttachmentData[]
  ) => void;
  handleBranch: (message: Message) => Promise<void>;
  convexMessages: ConvexMessages | undefined;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | null>(null);

export function useChatMessages() {
  const context = useContext(ChatMessagesContext);
  // if (!context) {
  //   throw new Error("useChatMessages must be used within a ChatMessagesProvider");
  // }
  return context || {
    messages: [],
    isLoadingMessages: false,
    isStreaming: false,
    handleRetry: () => {},
    handleEdit: () => {},
    handleBranch: () => Promise.resolve(),
    convexMessages: undefined
  };
}

export { ChatMessagesContext };
export type { ChatMessage, ChatMessagesContextType }; 