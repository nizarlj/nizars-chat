"use client";

import { useEffect, useCallback } from "react";
import { useRouterNavigation } from "./useRouterNavigation";

interface GlobalShortcutsOptions {
  onFocusSearch?: () => void;
  enableShortcuts?: boolean;
}

export function useGlobalShortcuts({
  onFocusSearch,
  enableShortcuts = true,
}: GlobalShortcutsOptions = {}) {
  const { navigateInstantly, pathname } = useRouterNavigation();

  const handleNewChat = useCallback(() => {
    // Only navigate if we're not already on the home page
    if (pathname !== "/") {
      navigateInstantly("/");
    }
  }, [navigateInstantly, pathname]);

  const handleFocusSearch = useCallback(() => {
    if (onFocusSearch) {
      onFocusSearch();
    }
  }, [onFocusSearch]);

  // Sidebar toggle is handled automatically by the sidebar component

  const handleOpenSettings = useCallback(() => {
    if (pathname !== "/settings") {
      navigateInstantly("/settings");
    }
  }, [navigateInstantly, pathname]);

  const handleOpenGallery = useCallback(() => {
    if (pathname !== "/gallery") {
      navigateInstantly("/gallery");
    }
  }, [navigateInstantly, pathname]);

  useEffect(() => {
    if (!enableShortcuts) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[contenteditable="true"]')
      ) {
        // Allow Ctrl+K to work even in input fields for search
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          handleFocusSearch();
        }
        return;
      }

      // New Chat: Ctrl+Shift+O
      if (e.key === 'O' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        handleNewChat();
        return;
      }

      // Search: Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleFocusSearch();
        return;
      }

      // Sidebar toggle (Ctrl+B) is handled automatically by the sidebar component

      // Settings: Ctrl+,
      if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleOpenSettings();
        return;
      }

      // Gallery: Ctrl+G
      if (e.key === 'g' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleOpenGallery();
        return;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    enableShortcuts,
    handleNewChat,
    handleFocusSearch,
    handleOpenSettings,
    handleOpenGallery,
  ]);

  return {
    shortcuts: {
      newChat: 'Ctrl+Shift+O',
      search: 'Ctrl+K',
      settings: 'Ctrl+,',
      gallery: 'Ctrl+G',
      modelSelector: 'Ctrl+M', // Already implemented
      toggleSidebar: 'Ctrl+B', // Handled automatically by sidebar component
    },
  };
} 