import { cn } from "./utils"

export const colorSchemes = {
  default: {
    solid: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border-border text-foreground hover:bg-accent hover:text-accent-foreground",
    ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
    soft: "bg-accent text-accent-foreground hover:bg-accent/80",
    focus: "focus-visible:border-ring focus-visible:ring-ring/50",
  },
  primary: {
    solid: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    ghost: "text-primary hover:bg-primary/10",
    soft: "bg-primary/10 text-primary hover:bg-primary/20",
    focus: "focus-visible:border-primary focus-visible:ring-primary/50",
  },
  secondary: {
    solid: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
    outline: "border-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground",
    ghost: "text-secondary-foreground hover:bg-secondary/50",
    soft: "bg-secondary/50 text-secondary-foreground hover:bg-secondary/70",
    focus: "focus-visible:border-secondary focus-visible:ring-secondary/50",
  },
  success: {
    solid: "border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600",
    outline: "border-green-600 text-green-700 hover:bg-green-600 hover:text-white dark:border-green-500 dark:text-green-400 dark:hover:bg-green-500",
    ghost: "text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950",
    soft: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900",
    focus: "focus-visible:border-green-600 focus-visible:ring-green-600/50",
  },
  warning: {
    solid: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700",
    outline: "border-yellow-500 text-yellow-700 hover:bg-yellow-500 hover:text-white dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-600",
    ghost: "text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-950",
    soft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-900",
    focus: "focus-visible:border-yellow-500 focus-visible:ring-yellow-500/50",
  },
  destructive: {
    solid: "border-transparent bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/80 dark:hover:bg-destructive/70",
    outline: "border-destructive text-destructive hover:bg-destructive hover:text-white",
    ghost: "text-destructive hover:bg-destructive/10",
    soft: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    focus: "focus-visible:border-destructive focus-visible:ring-destructive/50",
  },
  info: {
    solid: "border-transparent bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
    outline: "border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500",
    ghost: "text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950",
    soft: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900",
    focus: "focus-visible:border-blue-600 focus-visible:ring-blue-600/50",
  },
} as const

// Badge-specific color schemes with [a&]: prefix for anchor hover states
export const badgeColorSchemes = {
  default: {
    solid: cn(colorSchemes.default.solid, "[a&]:hover:bg-primary/90"),
    outline: cn(colorSchemes.default.outline, "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground"),
    ghost: cn(colorSchemes.default.ghost, "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground"),
    soft: cn(colorSchemes.default.soft, "[a&]:hover:bg-accent/80"),
    focus: colorSchemes.default.focus,
  },
  primary: {
    solid: cn(colorSchemes.primary.solid, "[a&]:hover:bg-primary/90"),
    outline: cn(colorSchemes.primary.outline, "[a&]:hover:bg-primary [a&]:hover:text-primary-foreground"),
    ghost: cn(colorSchemes.primary.ghost, "[a&]:hover:bg-primary/10"),
    soft: cn(colorSchemes.primary.soft, "[a&]:hover:bg-primary/20"),
    focus: colorSchemes.primary.focus,
  },
  secondary: {
    solid: cn(colorSchemes.secondary.solid, "[a&]:hover:bg-secondary/90"),
    outline: cn(colorSchemes.secondary.outline, "[a&]:hover:bg-secondary [a&]:hover:text-secondary-foreground"),
    ghost: cn(colorSchemes.secondary.ghost, "[a&]:hover:bg-secondary/50"),
    soft: cn(colorSchemes.secondary.soft, "[a&]:hover:bg-secondary/70"),
    focus: colorSchemes.secondary.focus,
  },
  success: {
    solid: cn(colorSchemes.success.solid, "[a&]:hover:bg-green-700 dark:bg-green-500 dark:[a&]:hover:bg-green-600"),
    outline: cn(colorSchemes.success.outline, "[a&]:hover:bg-green-600 [a&]:hover:text-white dark:border-green-500 dark:text-green-400 dark:[a&]:hover:bg-green-500"),
    ghost: cn(colorSchemes.success.ghost, "[a&]:hover:bg-green-100 dark:text-green-400 dark:[a&]:hover:bg-green-950"),
    soft: cn(colorSchemes.success.soft, "[a&]:hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:[a&]:hover:bg-green-900"),
    focus: colorSchemes.success.focus,
  },
  warning: {
    solid: cn(colorSchemes.warning.solid, "[a&]:hover:bg-yellow-600 dark:bg-yellow-600 dark:[a&]:hover:bg-yellow-700"),
    outline: cn(colorSchemes.warning.outline, "[a&]:hover:bg-yellow-500 [a&]:hover:text-white dark:border-yellow-600 dark:text-yellow-400 dark:[a&]:hover:bg-yellow-600"),
    ghost: cn(colorSchemes.warning.ghost, "[a&]:hover:bg-yellow-100 dark:text-yellow-400 dark:[a&]:hover:bg-yellow-950"),
    soft: cn(colorSchemes.warning.soft, "[a&]:hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:[a&]:hover:bg-yellow-900"),
    focus: colorSchemes.warning.focus,
  },
  destructive: {
    solid: cn(colorSchemes.destructive.solid, "[a&]:hover:bg-destructive/90 dark:bg-destructive/80 dark:[a&]:hover:bg-destructive/70"),
    outline: cn(colorSchemes.destructive.outline, "[a&]:hover:bg-destructive [a&]:hover:text-white"),
    ghost: cn(colorSchemes.destructive.ghost, "[a&]:hover:bg-destructive/10"),
    soft: cn(colorSchemes.destructive.soft, "[a&]:hover:bg-destructive/20"),
    focus: colorSchemes.destructive.focus
  },
  info: {
    solid: cn(colorSchemes.info.solid, "[a&]:hover:bg-blue-700 dark:bg-blue-500 dark:[a&]:hover:bg-blue-600"),
    outline: cn(colorSchemes.info.outline, "[a&]:hover:bg-blue-600 [a&]:hover:text-white dark:border-blue-500 dark:text-blue-400 dark:[a&]:hover:bg-blue-500"),
    ghost: cn(colorSchemes.info.ghost, "[a&]:hover:bg-blue-100 dark:text-blue-400 dark:[a&]:hover:bg-blue-950"),
    soft: cn(colorSchemes.info.soft, "[a&]:hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:[a&]:hover:bg-blue-900"),
    focus: colorSchemes.info.focus,
  },
} as const

export const styleVariants = {
  solid: "",
  outline: "bg-transparent",
  ghost: "border-transparent bg-transparent",
  soft: "border-transparent",
} as const

export type ColorScheme = keyof typeof colorSchemes
export type StyleVariant = keyof typeof styleVariants

/**
 * Get color and style classes for a component
 */
export function getColorClasses(color: ColorScheme, style: StyleVariant, isBadge = false) {
  const schemes = isBadge ? badgeColorSchemes : colorSchemes
  const colorScheme = schemes[color]
  const styleClasses = colorScheme?.[style] || ""
  const focusClasses = colorScheme?.focus || ""
  
  return {
    styleClasses,
    focusClasses,
    baseStyleClasses: styleVariants[style] || "",
  }
}

/**
 * Legacy variant mapping for backward compatibility
 */
export function mapLegacyVariant(variant?: string): { color: ColorScheme; style: StyleVariant } {
  switch (variant) {
    case "default":
      return { color: "default", style: "solid" }
    case "secondary":
      return { color: "secondary", style: "solid" }
    case "destructive":
      return { color: "destructive", style: "solid" }
    case "outline":
      return { color: "default", style: "outline" }
    case "ghost":
      return { color: "default", style: "ghost" }
    case "soft":
      return { color: "default", style: "soft" }
    default:
      return { color: "default", style: "solid" }
  }
} 