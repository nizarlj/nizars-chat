"use client";

import ChatInput from "./ChatInput";
import { ChatProvider, type ChatHandlers } from "./context";

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