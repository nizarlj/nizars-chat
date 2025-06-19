"use client"

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { Id } from "@convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Thread } from "@/hooks/useThreads"
import { useRouterPathname } from "@/hooks/useRouterNavigation"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SearchResultItemProps {
  type: "thread" | "message"
  thread: Thread
  messageId?: Id<"messages">
  messageContent?: string
  query: string
}

export function SearchResultItem({ 
  type, 
  thread, 
  messageId, 
  messageContent, 
  query 
}: SearchResultItemProps) {
  const pathname = useRouterPathname()
  const isActive = pathname === `/thread/${thread._id}` && (!messageId || pathname.includes(`messageId=${messageId}`))
  
  const linkTo = messageId 
    ? `/thread/${thread._id}?messageId=${messageId}`
    : `/thread/${thread._id}`

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-purple-200 dark:bg-purple-700 rounded px-0.5 text-black dark:text-white">
          {part}
        </mark>
      ) : part
    )
  }

  const getTitle = () => {
    const title = thread.userTitle || thread.title
    return highlightText(title, query)
  }

  const getPreview = () => {
    if (type === "message" && messageContent) {
      const queryLower = query.toLowerCase();
      const contentLower = messageContent.toLowerCase();
      const matchIndex = contentLower.indexOf(queryLower);
      const contextLength = 80; // characters before and after match

      let previewText = "";

      if (matchIndex !== -1) {
        // Show context around the match
        const start = Math.max(0, matchIndex - contextLength);
        const end = Math.min(messageContent.length, matchIndex + query.length + contextLength);
        
        previewText = messageContent.substring(start, end);

        // Add ellipsis if we're not at the beginning/end
        if (start > 0) {
          previewText = "..." + previewText;
        }
        if (end < messageContent.length) {
          previewText = previewText + "...";
        }
      } else {
        // Fallback if query not found (case-insensitive search might still match)
        previewText = messageContent.length > 200 
          ? messageContent.substring(0, 200) + "..."
          : messageContent;
      }
      
      return highlightText(previewText, query);
    }
    return null;
  };

  const fullTitle = thread.userTitle || thread.title;
  const fullPreview = type === "message" ? messageContent : null;

  const getTooltipPreview = () => {
    if (type === "message" && messageContent) {
      const maxTooltipLength = 400; // Show more in tooltip than in preview
      if (messageContent.length <= maxTooltipLength) {
        return messageContent;
      }
      
      const queryLower = query.toLowerCase();
      const contentLower = messageContent.toLowerCase();
      const matchIndex = contentLower.indexOf(queryLower);
      
      if (matchIndex !== -1) {
        // Center the tooltip around the match
        const halfLength = maxTooltipLength / 2;
        const start = Math.max(0, matchIndex - halfLength);
        const end = Math.min(messageContent.length, start + maxTooltipLength);
        
        let tooltipText = messageContent.substring(start, end);
        
        if (start > 0) {
          tooltipText = "..." + tooltipText;
        }
        if (end < messageContent.length) {
          tooltipText = tooltipText + "...";
        }
        
        return tooltipText;
      } else {
        // Fallback: show beginning of message
        return messageContent.substring(0, maxTooltipLength) + "...";
      }
    }
    return null;
  };

  return (
    <SidebarMenuItem className="group/search-item">
      <Link to={linkTo} className="block w-full cursor-pointer">
        <SidebarMenuButton 
          className={cn(
            "w-full text-left transition-all duration-200 group-hover/search-item:bg-muted flex-col items-start gap-1 py-2 h-auto cursor-pointer",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          <div className="flex items-start w-full gap-2">
            <div className="flex-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="font-medium text-sm leading-tight">
                    {getTitle()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{fullTitle}</p>
                </TooltipContent>
              </Tooltip>
              {getPreview() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {getPreview()}
                    </div>
                  </TooltipTrigger>
                  {fullPreview && (
                    <TooltipContent>
                      <p className="max-w-sm whitespace-pre-wrap">{getTooltipPreview()}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </div>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  )
} 