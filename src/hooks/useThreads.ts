import { useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { getDefaultModel } from '@/lib/models';
import { type FunctionReturnType } from "convex/server";
import { toast } from 'sonner';

type ThreadsQueryResult = FunctionReturnType<typeof api.threads.getUserThreads>;
export type Thread = ThreadsQueryResult[number];

const THREADS_CACHE_KEY = 'cached_threads';
const MAX_CACHED_THREADS = 200;

export const getCachedThreads = (): Thread[] => {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(THREADS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading cached threads:', error);
    return [];
  }
};

const setCachedThreads = (threads: Thread[]) => {
  if (typeof window === 'undefined') return;
  try {
    const threadsToCache = threads.slice(0, MAX_CACHED_THREADS);
    localStorage.setItem(THREADS_CACHE_KEY, JSON.stringify(threadsToCache));
  } catch (error) {
    console.error('Error caching threads:', error);
  }
};

export function useThreads() {
  const serverThreads = useQuery(api.threads.getUserThreads);
  
  useEffect(() => {
    if (serverThreads) setCachedThreads(serverThreads);
  }, [serverThreads]);
  
  const createThreadMutation = useMutation(api.threads.createThread);
  const branchThreadMutation = useMutation(api.threads.branchThread);
  const shareThreadMutation = useMutation(api.threads.shareThread);

  const deleteThreadMutation = useMutation(api.threads.deleteThread).withOptimisticUpdate(
    (localStore, args) => {
      const { threadId } = args;
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined) {
        const updatedThreads = existingThreads.filter(thread => thread._id !== threadId);
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
        setCachedThreads(updatedThreads);
      }
    }
  );
  
  const togglePinMutation = useMutation(api.threads.togglePin).withOptimisticUpdate(
    (localStore, args) => {
      const { threadId } = args;
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined) {
        const updatedThreads = existingThreads.map(thread =>
          thread._id === threadId
            ? { ...thread, pinned: !thread.pinned }
            : thread
        );
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
        setCachedThreads(updatedThreads);
      }
    }
  );

  const renameThreadMutation = useMutation(api.threads.renameThread).withOptimisticUpdate(
    (localStore, args) => {
      const { threadId, userTitle } = args;
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined && userTitle) {
        const updatedThreads = existingThreads.map(thread =>
          thread._id === threadId
            ? { ...thread, userTitle: userTitle }
            : thread
        );
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
        setCachedThreads(updatedThreads);
      }
    }
  );

  const createThread = useCallback(async (title: string, model?: string) => {
    return await createThreadMutation({
      title,
      model: model || getDefaultModel().id,
    });
  }, [createThreadMutation]);

  const branchThread = useCallback(async (
    originalThreadId: Id<"threads">, 
    branchFromMessageId: string
  ) => {
    return await branchThreadMutation({
      originalThreadId,
      branchFromMessageId
    });
  }, [branchThreadMutation]);

  const deleteThread = useCallback(async (threadId: Id<"threads">) => {
    await deleteThreadMutation({ threadId });
    toast.success("Thread deleted.");
  }, [deleteThreadMutation]);

  const togglePin = useCallback(async (threadId: Id<"threads">) => {
    await togglePinMutation({ threadId });
  }, [togglePinMutation]);

  const renameThread = useCallback(async (threadId: Id<"threads">, title: string) => {
    await renameThreadMutation({ threadId, userTitle: title });
    toast.success("Thread renamed.");
  }, [renameThreadMutation]);

  const shareThread = useCallback(async (threadId: Id<"threads">) => {
    try {
      const publicId = await shareThreadMutation({ threadId });
      if (!publicId) {
        toast.error("Failed to get public ID for shared thread.");
        return;
      }
      const shareUrl = `${window.location.origin}/share/${publicId}`;
      window.open(shareUrl, '_blank');
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied and opened in new tab.", {
        description: `URL: ${shareUrl}`
      });
    } catch (e) {
      toast.error("Failed to share thread.");
      console.error(e);
    }
  }, [shareThreadMutation]);
  
  const copyShareLink = useCallback(async (threadId: Id<"threads">) => {
      const thread = serverThreads?.find(t => t._id === threadId);
      if (!thread?.publicThreadId) {
          toast.error("This thread has not been shared yet.");
          return;
      }
      const shareUrl = `${window.location.origin}/share/${thread.publicThreadId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard.", {
        description: `URL: ${shareUrl}`
      });
  }, [serverThreads]);

  return {
    threads: serverThreads || getCachedThreads(),
    createThread,
    branchThread,
    deleteThread,
    togglePin,
    renameThread,
    shareThread,
    copyShareLink,
  };
} 