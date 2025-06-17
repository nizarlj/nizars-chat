import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { getColorClasses, mapLegacyVariant, type ColorScheme, type StyleVariant } from "@/lib/colorSystem"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      color: {
        default: "",
        primary: "",
        secondary: "",
        success: "",
        warning: "",
        destructive: "",
        info: "",
      },
      style: {
        solid: "",
        outline: "bg-transparent",
        ghost: "border-transparent bg-transparent",
        soft: "border-transparent",
      },
    },
    defaultVariants: {
      color: "default",
      style: "solid",
    },
  }
)

type BadgeProps = Omit<React.ComponentProps<"span">, "color" | "style"> & {
  asChild?: boolean
  style?: StyleVariant
  variant?: "default" | "secondary" | "destructive" | "outline"
  color?: ColorScheme
}

function Badge({
  className,
  variant,
  asChild = false,
  color,
  style,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  // Determine final color and style
  let finalColor = color || "default"
  let finalStyle = style || "solid"

  // Handle legacy variant mapping for backward compatibility
  if (variant && (!color || !style)) {
    const mapped = mapLegacyVariant(variant)
    finalColor = color || mapped.color
    finalStyle = style || mapped.style
  }

  // Get color classes
  const { styleClasses, focusClasses } = getColorClasses(finalColor, finalStyle, true)

  return (
    <Comp
      data-slot="badge"
      className={cn(
        badgeVariants({ color: finalColor, style: finalStyle }),
        styleClasses,
        focusClasses,
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
export type { BadgeProps, ColorScheme, StyleVariant }
