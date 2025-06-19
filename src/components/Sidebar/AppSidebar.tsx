"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { NewChatButton, UserProfile, ThreadGroup, FolderGroup } from "./components"
import { SearchResults } from "./components/SearchResults"
import { SidebarActions } from "./components/SidebarActions"
import { useThreads, Thread } from "@/hooks/useThreads"
import { useFolders } from "@/hooks/useFolders"
import { cn, scrollbarStyle } from "@/lib/utils"
import { useEffect, useRef, useState, useMemo } from "react"
import { toast } from "sonner"
import { useLocation } from "react-router-dom"
import { useRouterNavigation } from "@/hooks/useRouterNavigation"
import { getTimeGroupKey } from "./utils"
import { TIME_PERIODS } from "./constants"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"

export function AppSidebar() {
  const { threads: allThreads } = useThreads()
  const { folders } = useFolders()
  const prevThreadsRef = useRef<Map<string, Thread['status']>>(new Map());
  const location = useLocation();
  const { navigateInstantly } = useRouterNavigation();
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const searchResults = useQuery(api.search.search, debouncedSearchQuery && debouncedSearchQuery.length >= 3 ? { query: debouncedSearchQuery } : "skip");

  // Memoize the search results processing to prevent re-computation
  const processedSearchResults = useMemo(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 3 || !searchResults) return null;
    
    return {
      threads: searchResults.threads.map(t => ({
        ...t, 
        branchInfo: null, 
        shareInfo: { isShared: !!t.publicThreadId, isOutOfSync: false }
      })),
      messages: searchResults.messages,
      threadsFromMessages: searchResults.threads.filter(t => 
        searchResults.messages.some(m => m.threadId === t._id)
      ).map(t => ({
        ...t, 
        branchInfo: null, 
        shareInfo: { isShared: !!t.publicThreadId, isOutOfSync: false }
      }))
    };
  }, [debouncedSearchQuery, searchResults]);

  // Memoize the regular thread processing to prevent re-computation
  const processedThreads = useMemo(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) return { threads: [], unclassifiedThreads: [], threadsByFolder: {}, groupedUnclassifiedThreads: {} };
    
    const unclassifiedThreads = (allThreads || []).filter(t => !t.folderId);
    const threadsByFolder = (allThreads || []).reduce((groups, thread) => {
      if (thread.folderId) {
        if (!groups[thread.folderId]) {
          groups[thread.folderId] = [];
        }
        groups[thread.folderId].push(thread);
      }
      return groups;
    }, {} as Record<string, Thread[]>);

    const groupedUnclassifiedThreads = unclassifiedThreads.reduce((groups, thread) => {
      const key = getTimeGroupKey(thread)
      if (!groups[key]) groups[key] = []
      groups[key].push(thread)
      return groups
    }, {} as Record<string, Thread[]>);

    return {
      threads: allThreads,
      unclassifiedThreads,
      threadsByFolder,
      groupedUnclassifiedThreads
    };
  }, [allThreads, debouncedSearchQuery]);

  useEffect(() => {
    const currentThreadsMap = new Map((allThreads || []).map(t => [t._id, t.status]));
    
    (allThreads || []).forEach(thread => {
      const prevStatus = prevThreadsRef.current.get(thread._id);
      const currentStatus = thread.status;

      // Update recently completed state for any thread that finishes
      if (prevStatus === 'streaming' && currentStatus === 'idle') {
        setRecentlyCompleted(prev => new Set(prev).add(thread._id));
        setTimeout(() => {
          setRecentlyCompleted(prev => {
            const newSet = new Set(prev);
            newSet.delete(thread._id);
            return newSet;
          });
        }, 10000);
      }
      
      // Show toasts only for non-active threads
      const isActiveThread = location.pathname.includes(thread._id);
      if (prevStatus && prevStatus !== currentStatus && !isActiveThread) {
        if (currentStatus === 'idle' && prevStatus === 'streaming') {
          toast.success(`"${thread.title}" finished generating.`, {
            description: "A new response is available.",
            id: thread._id,
            action: {
              label: "View",
              onClick: () => navigateInstantly(`/thread/${thread._id}`),
            },
          });
        } else if (currentStatus === 'error') {
          toast.error(`"${thread.title}" failed.`, {
            description: "An error occurred while generating the response.",
            id: thread._id,
            action: {
              label: "Retry",
              onClick: () => navigateInstantly(`/thread/${thread._id}`),
            },
          });
        }
      }
    });

    prevThreadsRef.current = currentThreadsMap;
  }, [allThreads, location.pathname, navigateInstantly]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Memoize the search content to prevent re-renders
  const searchContent = useMemo(() => {
    if (!debouncedSearchQuery) return null;
    
    if (debouncedSearchQuery.length < 3) {
      return (
        <div className="mt-4 px-2">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-center">
              <Search className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Type at least 3 characters to search</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mt-4 px-2">
        {processedSearchResults ? (
          <SearchResults
            query={debouncedSearchQuery}
            threads={processedSearchResults.threads}
            messages={processedSearchResults.messages}
            threadsFromMessages={processedSearchResults.threadsFromMessages}
            recentlyCompleted={recentlyCompleted}
          />
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              <Search className="h-6 w-6 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Searching...</p>
            </div>
          </div>
        )}
      </div>
    );
  }, [debouncedSearchQuery, processedSearchResults, recentlyCompleted]);

  // Memoize the regular content to prevent re-renders
  const regularContent = useMemo(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) return null;
    
    return (
      <>
        {folders.map((folder, index) => {
          const folderThreads = processedThreads.threadsByFolder[folder._id] || [];
          const groupedFolderThreads = folderThreads.reduce((groups, thread) => {
            const key = getTimeGroupKey(thread)
            if (!groups[key]) groups[key] = []
            groups[key].push(thread)
            return groups
          }, {} as Record<string, Thread[]>);

          return (
            <FolderGroup 
              key={folder._id} 
              folder={folder}
              groupedThreads={groupedFolderThreads} 
              recentlyCompleted={recentlyCompleted}
              className={index === 0 ? "mt-4" : undefined}
            />
          )
        })}

        {folders.length > 0 && processedThreads.unclassifiedThreads.length > 0 && (
          <div className="my-2">
            <SidebarSeparator className="mx-0" />
          </div>
        )}

        {TIME_PERIODS.map((period) => (
          <ThreadGroup 
            key={period.key} 
            period={period} 
            threads={processedThreads.groupedUnclassifiedThreads[period.key] || []} 
            recentlyCompleted={recentlyCompleted}
          />
        ))}
      </>
    );
  }, [folders, processedThreads, recentlyCompleted, debouncedSearchQuery]);

  return (
    <Sidebar className="transition-all duration-100 ease-in-out">
      <SidebarHeader>
        <div className="flex justify-center items-center h-10">
          <h1 className="text-xl font-bold">Nizar&apos;s Chat</h1> 
        </div>

        <NewChatButton />
        <div className="flex items-center justify-between gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search threads / messages... (min 3 chars)"
              className="w-full rounded-lg bg-background pl-8 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                tooltip="Clear search"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        <SidebarActions />
      </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent className={cn("flex-1 overflow-y-auto", scrollbarStyle)}>
        {searchContent}
        {regularContent}
      </SidebarContent>
      
      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
} 