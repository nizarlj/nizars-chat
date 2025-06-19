import { useState, useCallback } from "react"

interface UseDialogStateOptions {
  initialOpen?: boolean
}

export function useDialogState(options: UseDialogStateOptions = {}) {
  const [isOpen, setIsOpen] = useState(options.initialOpen ?? false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  }
}

export function useMultipleDialogState<T extends Record<string, boolean>>(
  initialStates: T
) {
  const [states, setStates] = useState(initialStates)

  const openDialog = useCallback((key: keyof T) => {
    setStates(prev => ({ ...prev, [key]: true }))
  }, [])

  const closeDialog = useCallback((key: keyof T) => {
    setStates(prev => ({ ...prev, [key]: false }))
  }, [])

  const toggleDialog = useCallback((key: keyof T) => {
    setStates(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const closeAllDialogs = useCallback(() => {
    setStates(Object.keys(initialStates).reduce((acc, key) => ({ ...acc, [key]: false }), {} as T))
  }, [initialStates])

  return {
    states,
    openDialog,
    closeDialog,
    toggleDialog,
    closeAllDialogs,
    setStates
  }
} 