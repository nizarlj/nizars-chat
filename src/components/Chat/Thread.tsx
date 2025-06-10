"use client";

import ChatMessages from "./ChatMessages";
import { useChatContext } from "./ChatLayout";

export default function Thread() {
  const { messages, isStreaming } = useChatContext();
  
  return (
    <div className="flex-1 flex flex-col min-h-full">
      <ChatMessages messages={messages} isLoading={isStreaming} />
    </div>
  );
} 