"use client"

import { Image } from "lucide-react"

export function GalleryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg m-4">
      <div className="mb-4">
        <Image size={48} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        No images generated yet
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Your AI-generated images will appear here once you create them in a chat.
      </p>
    </div>
  )
}
