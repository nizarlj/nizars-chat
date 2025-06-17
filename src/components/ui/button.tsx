import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { getColorClasses, mapLegacyVariant, type ColorScheme, type StyleVariant } from "@/lib/colorSystem"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs border",
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
        ghost: "border-transparent bg-transparent shadow-none",
        soft: "border-transparent",
      },
      // Legacy variants for backward compatibility
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "text-primary underline-offset-4 hover:underline shadow-none border-transparent bg-transparent",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      color: "default",
      style: "solid",
      size: "default",
    },
  }
)

type ButtonProps = Omit<React.ComponentProps<"button">, "color" | "style"> & {
  asChild?: boolean
  size?: "default" | "sm" | "lg" | "icon"
  // New color and style system
  color?: ColorScheme
  style?: StyleVariant
  // Legacy variant support
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

function Button({
  className,
  variant,
  color,
  style,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  // Determine final color and style
  let finalColor = color || "default"
  let finalStyle = style || "solid"

  // Handle legacy variant mapping
  if (variant && (!color || !style)) {
    if (variant === "link") {
      // Special case for link variant
      return (
        <Comp
          data-slot="button"
          type={props.type || "button"}
          className={cn(
            "hover:cursor-pointer",
            buttonVariants({ variant: "link", size }),
            className
          )}
          {...props}
        />
      )
    }
    
    const mapped = mapLegacyVariant(variant)
    finalColor = color || mapped.color
    finalStyle = style || mapped.style
  }

  // Get color classes
  const { styleClasses, focusClasses } = getColorClasses(finalColor, finalStyle)

  return (
    <Comp
      data-slot="button"
      type={props.type || "button"}
      className={cn(
        "hover:cursor-pointer",
        buttonVariants({ color: finalColor, style: finalStyle, size }),
        styleClasses,
        focusClasses,
        className
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps, ColorScheme, StyleVariant }
