import { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { getDefaultModel } from '@/lib/models';
import { type FunctionReturnType } from "convex/server";

type ThreadsQueryResult = FunctionReturnType<typeof api.threads.getUserThreads>;
export type Thread = ThreadsQueryResult[number];

export function useThreads() {
  const threads = useQuery(api.threads.getUserThreads) || [];
  
  const createThreadMutation = useMutation(api.threads.createThread);
  const branchThreadMutation = useMutation(api.threads.branchThread);
  const deleteThreadMutation = useMutation(api.threads.deleteThread).withOptimisticUpdate(
    (localStore, args) => {
      const { threadId } = args;
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined) {
        const updatedThreads = existingThreads.filter(thread => thread._id !== threadId);
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
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
    threads,
    createThread,
    branchThread,
    deleteThread,
    togglePin,
  };
} 