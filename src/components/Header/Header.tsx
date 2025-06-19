"use client";

import { useChatMessages, useChatConfig, useChatThread } from "@/components/Chat/context";
import { useRouterNavigation } from "@/hooks/useRouterNavigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProviderIcon } from "@/components/Chat/shared";
import { getProviderDefinition } from "@/lib/models";
import { MessageSquare, Sparkles } from "lucide-react";
import KeyboardShortcuts from "./KeyboardShortcuts";

export function Header() {
  const { threadId } = useRouterNavigation();
  const { thread } = useChatThread();
  const { selectedModel } = useChatConfig();
  const { messages, isStreaming } = useChatMessages();

  const provider = getProviderDefinition(selectedModel?.provider || "openai");
  const threadTitle = thread?.userTitle || thread?.title;
  const messageCount = messages.length;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center space-x-4">
          {/* App Title */}
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">Nizar&apos;s Chat</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Current Thread Info */}
          {threadId && threadTitle ? (
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {threadTitle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">New conversation</span>
          )}
        </div>

        <div className="ml-auto flex items-center space-x-3">
          {/* Streaming Indicator */}
          {isStreaming && (
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          )}

          {/* Current Model */}
          {selectedModel && (
            <div className="flex items-center space-x-2">
              <ProviderIcon provider={provider.id} size="sm" />
              <Badge variant="outline" className="text-xs">
                {selectedModel.name}
              </Badge>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <KeyboardShortcuts />
        </div>
      </div>
    </header>
  );
} 