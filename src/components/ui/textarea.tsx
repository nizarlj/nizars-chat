import * as React from "react"
import { inputVariants } from "./input"

import { cn } from "@/lib/utils"

const textareaVariants = {
  default: cn(inputVariants.default, ""),
  chat: cn(inputVariants.chat, "min-h-16 resize-none max-h-52 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-rounded-md scrollbar-thumb-muted-foreground"),
}
type TextareaVariants = keyof typeof textareaVariants
type TextareaProps = React.ComponentProps<"textarea"> & { variant?: TextareaVariants }

function Textarea({ className, variant = "default", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        textareaVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
