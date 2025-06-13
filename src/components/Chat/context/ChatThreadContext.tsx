"use client";

import { createContext, useContext } from "react";
import { Doc } from "@convex/_generated/dataModel";

interface ChatThreadContextType {
  thread?: Doc<"threads"> | null;
}

const ChatThreadContext = createContext<ChatThreadContextType | null>(null);

export function useChatThread() {
  const context = useContext(ChatThreadContext);
  if (!context) {
    throw new Error("useChatThread must be used within a ChatThreadProvider");
  }
  return context;
}

export { ChatThreadContext };
export type { ChatThreadContextType }; 