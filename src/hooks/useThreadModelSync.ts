"use client";

import { useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { SupportedModelId } from '@/lib/models';

interface UseThreadModelSyncOptions {
  threadId: Id<"threads"> | undefined;
  thread: { model: string } | null | undefined;
  selectedModelId: SupportedModelId;
  lastThreadModel: string | null;
  syncWithThread: (threadModel: string | null) => void;
}

export function useThreadModelSync({
  threadId,
  thread,
  selectedModelId,
  lastThreadModel,
  syncWithThread,
}: UseThreadModelSyncOptions) {
  const updateThreadModelMutation = useMutation(api.threads.updateThreadModel);

  // Sync local model state with thread model when thread changes
  useEffect(() => {
    if (threadId && thread) syncWithThread(thread.model);
    else if (!threadId) syncWithThread(null);
  }, [threadId, thread, syncWithThread]);

  const updateThreadModel = useCallback(() => {
    if (
      threadId && 
      thread && 
      thread.model !== selectedModelId &&
      lastThreadModel === thread.model
    ) {
      updateThreadModelMutation({
        threadId,
        model: selectedModelId,
      });
    }
  }, [threadId, thread, selectedModelId, lastThreadModel, updateThreadModelMutation]);

  useEffect(() => {
    updateThreadModel();
  }, [updateThreadModel]);

  return {
    updateThreadModel,
  };
} 