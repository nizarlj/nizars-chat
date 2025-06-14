"use client";

import { ChatProvider, type ChatHandlers } from "@/components/Chat/context";
import { ChatInput } from "@/components/Chat/input";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <ChatProvider>
      {(handlers: ChatHandlers) => (
        <>
          <div className="flex-1">
            {children}
          </div>

          <div className="px-4 sticky bottom-0">
            <ChatInput
              input={handlers.input}
              onInputChange={handlers.handleInputChange}
              onSubmit={handlers.handleSubmit}
              isDisabled={handlers.isStreaming}
            />
          </div>
        </>
      )}
    </ChatProvider>
  );
}