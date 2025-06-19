"use client"

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Thread } from "@/hooks/useThreads"
import { useState } from "react"
import { toast } from "sonner"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { TagInput, type Tag } from "emblor"

interface ManageTagsDialogProps {
  thread: Thread
  setOpen: (open: boolean) => void
}

export function ManageTagsDialog({ thread, setOpen }: ManageTagsDialogProps) {
  const allTags = useQuery(api.threads.getAllTags) ?? []
  const [tags, setTags] = useState<Tag[]>(
    (thread.tags || []).map((t) => ({ id: t, text: t })),
  )
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)

  const addTag = useMutation(api.threads.addTagToThread).withOptimisticUpdate(
    (localStore, args) => {
      const { threadId, tag } = args;
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined) {
        const updatedThreads = existingThreads.map(thread =>
          thread._id === threadId
            ? { 
                ...thread, 
                tags: Array.from(new Set([...(thread.tags || []), tag]))
              }
            : thread
        );
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
      }
    }
  );

  const removeTag = useMutation(api.threads.removeTagFromThread).withOptimisticUpdate(
    (localStore, args) => {
      const { threadId, tag } = args;
      const existingThreads = localStore.getQuery(api.threads.getUserThreads);
      if (existingThreads !== undefined) {
        const updatedThreads = existingThreads.map(thread =>
          thread._id === threadId
            ? { 
                ...thread, 
                tags: (thread.tags || []).filter(t => t !== tag)
              }
            : thread
        );
        localStore.setQuery(api.threads.getUserThreads, {}, updatedThreads);
      }
    }
  );

  const handleSave = () => {
    const originalTags = new Set(thread.tags || [])
    const newTags = new Set(tags.map((t) => t.text))

    const tagsToAdd = [...newTags].filter((t) => !originalTags.has(t))
    const tagsToRemove = [...originalTags].filter((t) => !newTags.has(t))

    const promises = [
      ...tagsToAdd.map((tag) => addTag({ threadId: thread._id, tag })),
      ...tagsToRemove.map((tag) => removeTag({ threadId: thread._id, tag })),
    ]

    toast.promise(Promise.all(promises), {
      loading: "Saving tags...",
      success: "Tags saved",
      error: "Failed to save tags",
    })

    setOpen(false)
  }

  const autocompleteOptions = allTags.map((t) => ({ id: t, text: t }))

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogDescription>
          Add or remove tags for &quot;{thread.userTitle || thread.title}&quot;.
        </DialogDescription>
      </DialogHeader>

      <TagInput
        tags={tags}
        setTags={setTags}
        placeholder="Add a tag..."
        enableAutocomplete
        autocompleteOptions={autocompleteOptions}
        showCount
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
        styleClasses={{
          autoComplete: {
            popoverContent: "bg-popover text-popover-foreground",
          }
        }}
      />

      <DialogFooter className="mt-4">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </DialogContent>
  )
} 