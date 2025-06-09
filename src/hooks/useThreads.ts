import { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Doc, Id } from '@convex/_generated/dataModel';

export type Thread = Doc<"threads">;

export function useThreads() {
  const threads = useQuery(api.threads.getUserThreads) || [];
  
  const createThreadMutation = useMutation(api.threads.createThread);
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
      model: model || 'gemini-2.0-flash',
    });
  }, [createThreadMutation]);

  const deleteThread = useCallback(async (threadId: Id<"threads">) => {
    await deleteThreadMutation({ threadId });
  }, [deleteThreadMutation]);

  const togglePin = useCallback(async (threadId: Id<"threads">) => {
    await togglePinMutation({ threadId });
  }, [togglePinMutation]);

  return {
    threads,
    createThread,
    deleteThread,
    togglePin,
  };
} 