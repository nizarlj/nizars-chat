"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ConfirmationDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  itemName?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  trigger?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  trigger
}: ConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use controlled or uncontrolled mode
  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : internalOpen
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen

  const handleConfirm = () => {
    onConfirm()
    setDialogOpen(false)
  }

  const dialogContent = (
    <DialogContent onClick={e => e.stopPropagation()}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description}
          {itemName && ` "${itemName}"`}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="ghost" onClick={e => {
          e.stopPropagation()
          setDialogOpen(false)
        }}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={e => {
          e.stopPropagation()
          handleConfirm()
        }}>
          {confirmText}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  if (trigger) {
    // Trigger-based mode (uncontrolled)
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  // Controlled mode
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {dialogContent}
    </Dialog>
  )
}

// Convenience component for delete confirmations
export function DeleteConfirmationDialog(props: Omit<ConfirmationDialogProps, 'variant' | 'confirmText'> & { confirmText?: string }) {
  return (
    <ConfirmationDialog
      {...props}
      variant="destructive"
      confirmText={props.confirmText || "Delete"}
    />
  )
} 