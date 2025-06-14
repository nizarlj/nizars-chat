"use client";

import { ChatMessages } from "./messages";

export default function Thread() {
  return (
    <div className="flex-1 flex flex-col min-h-full">
      <ChatMessages />
    </div>
  );
} 