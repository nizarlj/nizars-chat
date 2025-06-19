"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover"
import { useState, useContext, createContext } from "react"

const MenuContext = createContext<{ closeMenu?: () => void }>({})

export const MenuProvider = MenuContext.Provider

export function useMenuContext() {
  return useContext(MenuContext)
}

interface ContextMenuProps {
  children: React.ReactNode
  content: React.ReactNode
  contentClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ContextMenu({ children, content, contentClassName, open, onOpenChange }: ContextMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 })

  const isControlled = open !== undefined && onOpenChange !== undefined
  const menuOpen = isControlled ? open : internalOpen
  const setMenuOpen = isControlled ? onOpenChange : setInternalOpen

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchorPoint({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger asChild>
        <div 
          onContextMenu={handleContextMenu}
          onClick={(e) => {
            // Prevent left-click from opening the popover
            e.preventDefault()
          }}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverAnchor style={{ position: 'fixed', left: anchorPoint.x, top: anchorPoint.y }} />
      <PopoverContent className={contentClassName} onFocusOutside={(e) => {
        if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"]')) {
            e.preventDefault();
        }
      }}>
        <MenuProvider value={{ closeMenu: () => setMenuOpen(false) }}>
          {content}
        </MenuProvider>
      </PopoverContent>
    </Popover>
  )
} 