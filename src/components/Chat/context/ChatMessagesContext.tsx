"use client";

import { createContext, useContext } from "react";
import { type Message } from "ai";
import { Doc, Id } from "@convex/_generated/dataModel";
import { SupportedModelId } from "@/lib/models";
import { type FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";

type ChatMessage = Message & { metadata?: Doc<"messages">["metadata"] };
type ConvexMessages = FunctionReturnType<typeof api.messages.getThreadMessages>;

interface ChatMessagesContextType {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isStreaming: boolean;
  handleRetry: (messageToRetry: Message, retryModelId?: SupportedModelId) => Promise<void>;
  handleEdit: (messageToEdit: Message, newContent: string, finalAttachmentIds: Id<'attachments'>[]) => Promise<void>;
  convexMessages: ConvexMessages | undefined;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | null>(null);

export function useChatMessages() {
  const context = useContext(ChatMessagesContext);
  if (!context) {
    throw new Error("useChatMessages must be used within a ChatMessagesProvider");
  }
  return context;
}

export { ChatMessagesContext };
export type { ChatMessage, ChatMessagesContextType }; 