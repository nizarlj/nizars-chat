import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const colorSchemes = {
  default: {
    solid: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
    outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
    ghost: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
    soft: "bg-accent text-accent-foreground [a&]:hover:bg-accent/80",
    focus: "focus-visible:border-ring focus-visible:ring-ring/50",
  },
  primary: {
    solid: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
    outline: "border-primary text-primary [a&]:hover:bg-primary [a&]:hover:text-primary-foreground",
    ghost: "text-primary [a&]:hover:bg-primary/10",
    soft: "bg-primary/10 text-primary [a&]:hover:bg-primary/20",
    focus: "focus-visible:border-primary focus-visible:ring-primary/50",
  },
  secondary: {
    solid: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
    outline: "border-secondary text-secondary-foreground [a&]:hover:bg-secondary [a&]:hover:text-secondary-foreground",
    ghost: "text-secondary-foreground [a&]:hover:bg-secondary/50",
    soft: "bg-secondary/50 text-secondary-foreground [a&]:hover:bg-secondary/70",
    focus: "focus-visible:border-secondary focus-visible:ring-secondary/50",
  },
  success: {
    solid: "border-transparent bg-green-600 text-white [a&]:hover:bg-green-700 dark:bg-green-500 dark:[a&]:hover:bg-green-600",
    outline: "border-green-600 text-green-700 [a&]:hover:bg-green-600 [a&]:hover:text-white dark:border-green-500 dark:text-green-400 dark:[a&]:hover:bg-green-500",
    ghost: "text-green-700 [a&]:hover:bg-green-100 dark:text-green-400 dark:[a&]:hover:bg-green-950",
    soft: "bg-green-100 text-green-800 [a&]:hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:[a&]:hover:bg-green-900",
    focus: "focus-visible:border-green-600 focus-visible:ring-green-600/50",
  },
  warning: {
    solid: "border-transparent bg-yellow-500 text-white [a&]:hover:bg-yellow-600 dark:bg-yellow-600 dark:[a&]:hover:bg-yellow-700",
    outline: "border-yellow-500 text-yellow-700 [a&]:hover:bg-yellow-500 [a&]:hover:text-white dark:border-yellow-600 dark:text-yellow-400 dark:[a&]:hover:bg-yellow-600",
    ghost: "text-yellow-700 [a&]:hover:bg-yellow-100 dark:text-yellow-400 dark:[a&]:hover:bg-yellow-950",
    soft: "bg-yellow-100 text-yellow-800 [a&]:hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:[a&]:hover:bg-yellow-900",
    focus: "focus-visible:border-yellow-500 focus-visible:ring-yellow-500/50",
  },
  destructive: {
    solid: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 dark:bg-destructive/80 dark:[a&]:hover:bg-destructive/70",
    outline: "border-destructive text-destructive [a&]:hover:bg-destructive [a&]:hover:text-white",
    ghost: "text-destructive [a&]:hover:bg-destructive/10",
    soft: "bg-destructive/10 text-destructive [a&]:hover:bg-destructive/20",
    focus: "focus-visible:border-destructive focus-visible:ring-destructive/50",
  },
  info: {
    solid: "border-transparent bg-blue-600 text-white [a&]:hover:bg-blue-700 dark:bg-blue-500 dark:[a&]:hover:bg-blue-600",
    outline: "border-blue-600 text-blue-700 [a&]:hover:bg-blue-600 [a&]:hover:text-white dark:border-blue-500 dark:text-blue-400 dark:[a&]:hover:bg-blue-500",
    ghost: "text-blue-700 [a&]:hover:bg-blue-100 dark:text-blue-400 dark:[a&]:hover:bg-blue-950",
    soft: "bg-blue-100 text-blue-800 [a&]:hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:[a&]:hover:bg-blue-900",
    focus: "focus-visible:border-blue-600 focus-visible:ring-blue-600/50",
  },
} as const

const styleVariants = {
  solid: "",
  outline: "bg-transparent",
  ghost: "border-transparent bg-transparent",
  soft: "border-transparent",
} as const

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
      style: styleVariants,
    },
    defaultVariants: {
      color: "default",
      style: "solid",
    },
  }
)

type BadgeStyle = keyof typeof styleVariants
type BadgeColor = keyof typeof colorSchemes

type BadgeProps = Omit<React.ComponentProps<"span">, "color" | "style"> & {
  asChild?: boolean
  style?: BadgeStyle
  variant?: "default" | "secondary" | "destructive" | "outline"
  color?: BadgeColor
}

function Badge({
  className,
  variant,
  asChild = false,
  color = "default",
  style = "solid",
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  let finalColor = color
  let finalStyle = style

  if (variant && !color && !style) {
    switch (variant) {
      case "default":
        finalColor = "default"
        finalStyle = "solid"
        break
      case "secondary":
        finalColor = "secondary"
        finalStyle = "solid"
        break
      case "destructive":
        finalColor = "destructive"
        finalStyle = "solid"
        break
      case "outline":
        finalColor = "default"
        finalStyle = "outline"
        break
    }
  }

  const colorScheme = colorSchemes[finalColor as keyof typeof colorSchemes]
  const styleClasses = colorScheme?.[finalStyle as keyof typeof colorScheme] || ""
  const focusClasses = colorScheme?.focus || ""

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
