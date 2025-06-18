"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { AttachmentFileListLoading } from "@/components/Settings/Attachments/AttachmentFileListLoading"
import { GalleryEmptyState } from "@/components/Gallery/GalleryEmptyState"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Grid, Rows, Columns, Link as LinkIcon } from "lucide-react"
import { Doc, Id } from "@convex/_generated/dataModel"
import AttachmentPreviewModal from "@/components/Chat/attachments/AttachmentPreviewModal"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Masonry from "react-masonry-css"
import { format, formatDistanceToNow } from "date-fns"
import { useRouterNavigation } from "@/hooks/useRouterNavigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExternalLinkButton, DownloadButton } from "@/components/Chat/shared"

type AttachmentWithDetails = Doc<"attachments"> & {
  url: string | null
  prompt: string | null
  threadId: Id<"threads"> | null
}

export default function GalleryPage() {
  const attachments = useQuery(api.attachments.getGeneratedImages)
  const [viewMode, setViewMode] = useState<"grid" | "carousel" | "collage">(
    "grid"
  )
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentWithDetails | null>(null)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const { navigateInstantly } = useRouterNavigation()

  const handleOpenModal = (attachment: AttachmentWithDetails) => {
    setSelectedAttachment(attachment)
  }

  const handleCloseModal = () => {
    setSelectedAttachment(null)
  }

  const handleLinkClick = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation()
    navigateInstantly(`/thread/${threadId}`)
  }

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  const renderContent = () => {
    if (attachments === undefined) {
      return <AttachmentFileListLoading />
    }
    if (attachments.length === 0) {
      return <GalleryEmptyState />
    }

    const imageCards = attachments.map(attachment => (
      <div
        key={attachment._id}
        className="relative rounded-lg overflow-hidden group shadow-lg cursor-pointer break-inside-avoid"
        onClick={() => handleOpenModal(attachment)}
      >
        <Image
          src={attachment.url!}
          alt={attachment.fileName}
          width={500}
          height={500}
          className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          {attachment.prompt && (
            <p className="text-white text-sm font-medium line-clamp-3">
              {attachment.prompt}
            </p>
          )}
          <div className="flex justify-between items-center mt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <p className="text-gray-300 text-xs">
                    {formatDistanceToNow(new Date(attachment.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  {format(new Date(attachment.createdAt), "PPP p")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {attachment.threadId && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 hover:bg-white/20"
                onClick={e => handleLinkClick(e, attachment.threadId!)}
                tooltip="Go to thread"
              >
                <LinkIcon className="w-4 h-4 text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>
    ))

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4">
          {imageCards}
        </div>
      )
    }

    if (viewMode === "collage") {
      const breakpointColumnsObj = {
        default: 5,
        1536: 5, // 2xl
        1280: 4, // xl
        1024: 3, // lg
        768: 2, // md
        640: 2, // sm
      }
      return (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto space-x-4 p-4"
          columnClassName="bg-clip-padding space-y-4"
        >
          {imageCards}
        </Masonry>
      )
    }

    if (viewMode === "carousel") {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="overflow-hidden w-full max-w-4xl" ref={emblaRef}>
            <div className="flex">
              {attachments.map(attachment => (
                <div
                  key={attachment._id}
                  className="flex-[0_0_100%] min-w-0 relative"
                >
                  <div className="relative w-full h-[70vh]">
                    <Image
                      src={attachment.url!}
                      alt={attachment.fileName}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-center p-4 bg-background">
                    <p className="font-medium">{attachment.prompt}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(attachment.createdAt), "PPP p")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2"
            onClick={scrollPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2"
            onClick={scrollNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Image Gallery</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              aria-label="Grid View"
            >
              <Grid className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === "collage" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("collage")}
              aria-label="Collage View"
            >
              <Columns className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === "carousel" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("carousel")}
              aria-label="Carousel View"
            >
              <Rows className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      {selectedAttachment && (
        <AttachmentPreviewModal
          attachment={{
            name: selectedAttachment.fileName,
            contentType: selectedAttachment.mimeType,
            url: selectedAttachment.url!,
            prompt: selectedAttachment.prompt,
            threadId: selectedAttachment.threadId,
            createdAt: selectedAttachment.createdAt,
          }}
          onOpenChange={(open: boolean) => !open && handleCloseModal()}
          renderHeaderActions={attachment => (
            <>
              {attachment.threadId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={e => handleLinkClick(e, attachment.threadId!)}
                  tooltip="Go to thread"
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              )}
              {attachment.url && <ExternalLinkButton url={attachment.url} />}
              {attachment.url && (
                <DownloadButton
                  url={attachment.url}
                  filename={attachment.name || "file.txt"}
                />
              )}
            </>
          )}
          renderFooter={attachment => (
            <div className="text-sm max-h-48 overflow-y-auto p-4 space-y-4">
              {attachment.prompt && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-1">Prompt</p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {attachment.prompt}
                  </p>
                </div>
              )}
              {attachment.createdAt && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Created</span>
                  <time dateTime={new Date(attachment.createdAt).toISOString()}>
                    {format(new Date(attachment.createdAt), "PPP 'at' p")}
                  </time>
                </div>
              )}
            </div>
          )}
        />
      )}
    </div>
  )
} 