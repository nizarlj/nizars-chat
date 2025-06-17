"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

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

  return {
    navigateInstantly,
    replaceInstantly,
    isPending: false,
    isNavigating: false,
    navigatingTo: null,
    pathname: location.pathname,
  };
}

export function useRouterPathname() {
  const location = useLocation();
  return location.pathname;
} 