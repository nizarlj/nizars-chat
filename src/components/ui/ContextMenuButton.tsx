"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { useMenuContext } from "./ContextMenu"


interface ContextMenuButtonProps {
  icon: LucideIcon
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "destructive"
  className?: string
}

export function ContextMenuButton({ 
  icon: Icon, 
  children, 
  onClick, 
  variant = "default",
  className 
}: ContextMenuButtonProps) {
  const { closeMenu } = useMenuContext()
  
  const handleClick = () => {
    onClick?.()
    closeMenu?.()
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={cn(
        "w-full justify-start gap-2 h-7",
        variant === "destructive" && "text-destructive hover:text-destructive",
        className
      )}
      onClick={handleClick}
    >
      <Icon className="h-3 w-3" />
      <span>{children}</span>
    </Button>
  )
} 