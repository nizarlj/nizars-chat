"use client"

import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface EditableTitleProps {
  initialTitle: string
  isRenaming: boolean
  onRename: (newTitle: string) => void
  onCancel: () => void
  inputClassName?: string
  containerClassName?: string
  textClassName?: string
  formClassName?: string
  children?: React.ReactNode
}

export function EditableTitle({
  initialTitle,
  isRenaming,
  onRename,
  onCancel,
  inputClassName,
  containerClassName,
  textClassName,
  formClassName,
  children,
}: EditableTitleProps) {
  const [title, setTitle] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  useEffect(() => {
    if (isRenaming) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isRenaming])

  const handleSubmit = () => {
    if (title.trim() && title.trim() !== initialTitle) {
      onRename(title.trim())
    } else {
      onCancel()
    }
  }

  if (isRenaming) {
    return (
      <div className={cn("w-full flex-1", containerClassName)}>
        <form action="" className={cn("w-full h-full", formClassName)} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSubmit}
            className={cn("h-full text-sm font-medium px-0 py-0 border-none bg-transparent focus-visible:ring-1 focus-visible:ring-ring rounded-none border-b border-border focus-visible:border-primary", inputClassName)}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          />
        </form>
      </div>
    )
  }
  
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span ref={textRef} className={cn("w-full flex-1 text-left truncate", textClassName)}>
          {children || initialTitle}
        </span>
      </TooltipTrigger>
      <TooltipContent>{initialTitle}</TooltipContent>
    </Tooltip>
  )
} 