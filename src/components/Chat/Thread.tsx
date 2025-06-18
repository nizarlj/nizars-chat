"use client";

import { useRef } from "react";
import { ChatMessages } from "./messages";

interface ThreadProps {
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export default function Thread({ messagesEndRef }: ThreadProps) {
  return (
    <div className="flex-1 flex flex-col min-h-full">
      <ChatMessages messagesEndRef={messagesEndRef} />
    </div>
  );
} 