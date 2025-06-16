import { useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { getDefaultModel } from '@/lib/models';
import { type FunctionReturnType } from "convex/server";

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
  }, [deleteThreadMutation]);

  const togglePin = useCallback(async (threadId: Id<"threads">) => {
    await togglePinMutation({ threadId });
  }, [togglePinMutation]);

  return {
    threads: serverThreads || getCachedThreads(),
    createThread,
    branchThread,
    deleteThread,
    togglePin,
  };
} 