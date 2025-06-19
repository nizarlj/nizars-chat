"use client";

import { useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { type FunctionReturnType } from "convex/server";
import { toast } from 'sonner';

type FoldersQueryResult = FunctionReturnType<typeof api.folders.getFolders>;
export type Folder = FoldersQueryResult[number];

export const FOLDERS_CACHE_KEY = 'cached_folders';
const MAX_CACHED_FOLDERS = 100;

export const getCachedFolders = (): Folder[] => {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(FOLDERS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading cached folders:', error);
    return [];
  }
};

const setCachedFolders = (folders: Folder[]) => {
  if (typeof window === 'undefined') return;
  try {
    const foldersToCache = folders.slice(0, MAX_CACHED_FOLDERS);
    localStorage.setItem(FOLDERS_CACHE_KEY, JSON.stringify(foldersToCache));
  } catch (error) {
    console.error('Error caching folders:', error);
  }
};

export function useFolders() {
  const serverFolders = useQuery(api.folders.getFolders);
  
  useEffect(() => {
    if (serverFolders) setCachedFolders(serverFolders);
  }, [serverFolders]);
  
  const createFolderMutation = useMutation(api.folders.createFolder).withOptimisticUpdate(
    (localStore, args) => {
      const { name, color } = args;
      const existingFolders = localStore.getQuery(api.folders.getFolders);
      if (existingFolders !== undefined) {
        // Create a temporary folder with a placeholder ID
        const tempFolder: Folder = {
          _id: `temp_${Date.now()}` as Id<"folders">,
          _creationTime: Date.now(),
          name,
          color,
          userId: "temp" as Id<"users">,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const updatedFolders = [tempFolder, ...existingFolders];
        localStore.setQuery(api.folders.getFolders, {}, updatedFolders);
        setCachedFolders(updatedFolders);
      }
    }
  );

  const updateFolderMutation = useMutation(api.folders.updateFolder).withOptimisticUpdate(
    (localStore, args) => {
      const { folderId, name, color } = args;
      const existingFolders = localStore.getQuery(api.folders.getFolders);
      if (existingFolders !== undefined) {
        const updatedFolders = existingFolders.map(folder =>
          folder._id === folderId
            ? { 
                ...folder, 
                ...(name !== undefined && { name }),
                ...(color !== undefined && { color }),
                updatedAt: Date.now()
              }
            : folder
        );
        localStore.setQuery(api.folders.getFolders, {}, updatedFolders);
        setCachedFolders(updatedFolders);
      }
    }
  );
  
  const deleteFolderMutation = useMutation(api.folders.deleteFolder).withOptimisticUpdate(
    (localStore, args) => {
      const { folderId } = args;
      const existingFolders = localStore.getQuery(api.folders.getFolders);
      if (existingFolders !== undefined) {
        const updatedFolders = existingFolders.filter(folder => folder._id !== folderId);
        localStore.setQuery(api.folders.getFolders, {}, updatedFolders);
        setCachedFolders(updatedFolders);
      }

      // Also update threads to remove them from the deleted folder
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined) {
        const updatedThreads = existingThreads.map(thread =>
          thread.folderId === folderId ? { ...thread, folderId: undefined } : thread
        );
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
      }
    }
  );

  const moveThreadToFolderMutation = useMutation(api.folders.moveThreadToFolder).withOptimisticUpdate(
    (localStore, args) => {
      const { threadId, folderId } = args;
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined) {
        const updatedThreads = existingThreads.map(thread =>
          thread._id === threadId ? { ...thread, folderId } : thread
        );
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
      }
    }
  );

  const createFolder = useCallback(async (name: string, color?: string) => {
    const result = await createFolderMutation({ name, color });
    toast.success("Folder created.");
    return result;
  }, [createFolderMutation]);

  const updateFolder = useCallback(async (
    folderId: Id<"folders">, 
    name?: string, 
    color?: string
  ) => {
    await updateFolderMutation({ folderId, name, color });
    toast.success("Folder updated.");
  }, [updateFolderMutation]);

  const deleteFolder = useCallback(async (folderId: Id<"folders">) => {
    await deleteFolderMutation({ folderId });
    toast.success("Folder deleted.");
  }, [deleteFolderMutation]);

  const moveThreadToFolder = useCallback(async (
    threadId: Id<"threads">, 
    folderId?: Id<"folders">
  ) => {
    await moveThreadToFolderMutation({ threadId, folderId });
    const action = folderId ? "moved to folder" : "removed from folder";
    toast.success(`Thread ${action}.`);
  }, [moveThreadToFolderMutation]);

  return {
    folders: serverFolders || getCachedFolders(),
    createFolder,
    updateFolder,
    deleteFolder,
    moveThreadToFolder,
  };
} 