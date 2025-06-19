"use client"

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar"
import { SearchResultItem } from "./SearchResultItem"
import { ThreadItem } from "./ThreadItem"
import { Thread } from "@/hooks/useThreads"
import { Id } from "@convex/_generated/dataModel"
import { FileText, MessageSquare } from "lucide-react"

interface SearchMessage {
  _id: Id<"messages">
  content: string
  threadId: Id<"threads">
  role: "user" | "assistant" | "system"
}

interface SearchResultsProps {
  query: string
  threads: Thread[]
  messages: SearchMessage[]
  threadsFromMessages: Thread[]
  recentlyCompleted: Set<string>
}

export function SearchResults({ 
  query, 
  threads, 
  messages, 
  threadsFromMessages,
  recentlyCompleted
}: SearchResultsProps) {
  // Separate threads found by title/tags vs threads found through messages
  const directThreadMatches = threads.filter(thread => 
    !threadsFromMessages.some(msgThread => msgThread._id === thread._id)
  )

  const hasResults = directThreadMatches.length > 0 || messages.length > 0

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-muted-foreground mb-2">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No results found</p>
          <p className="text-xs mt-1">Try different keywords</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Direct thread matches */}
      {directThreadMatches.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <FileText className="h-3 w-3" />
            Threads ({directThreadMatches.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {directThreadMatches.map(thread => (
                <ThreadItem
                  key={thread._id}
                  thread={thread}
                  isRecentlyCompleted={recentlyCompleted.has(thread._id)}
                  query={query}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Message matches */}
      {messages.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            Messages ({messages.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {messages.map(message => {
                const thread = threadsFromMessages.find(t => t._id === message.threadId)
                if (!thread) return null
                
                return (
                  <SearchResultItem
                    key={message._id}
                    type="message"
                    thread={thread}
                    messageId={message._id}
                    messageContent={message.content}
                    query={query}
                  />
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </div>
  )
} 