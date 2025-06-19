"use client";

import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export function useCurrentThreadId() {
  const { threadId } = useParams<{ threadId: string }>();
  return threadId;
}

export function useRouterNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateInstantly = useCallback((href: string) => {
    if (!href.startsWith('/')) return;
    if (href === location.pathname) return;
    
    navigate(href);
  }, [navigate, location.pathname]);

  const replaceInstantly = useCallback((href: string) => {
    if (!href.startsWith('/')) return;
    if (href === location.pathname) return;
    
    navigate(href, { replace: true });
  }, [navigate, location.pathname]);

  const threadId = useMemo(() => {
    // Handle both /thread/:id and /share/:id patterns
    const threadMatch = location.pathname.match(/\/thread\/([^\/]+)/);
    const shareMatch = location.pathname.match(/\/share\/([^\/]+)/);
    return threadMatch ? threadMatch[1] : shareMatch ? shareMatch[1] : undefined;
  }, [location.pathname]);

  const settingsTab = useMemo(() => {
    const match = location.pathname.match(/\/settings\/([^\/]+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  return {
    navigateInstantly,
    replaceInstantly,
    isPending: false,
    isNavigating: false,
    navigatingTo: null,
    pathname: location.pathname,
    threadId,
    settingsTab,
  };
}

export function useRouterPathname() {
  const location = useLocation();
  return location.pathname;
} 