"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useCallback, useEffect, useState } from "react";

// Hook to get the current path instantly, including instant URL changes
export function useInstantPathname() {
  const pathname = usePathname();
  const [instantPathname, setInstantPathname] = useState(pathname);

  useEffect(() => {
    setInstantPathname(pathname);
  }, [pathname]);

  useEffect(() => {
    // Listen for instant navigation events to update path immediately
    const handleNavStart = (e: CustomEvent) => {
      if (e.detail?.href) {
        setInstantPathname(e.detail.href);
      }
    };

    const handleNavEnd = () => {
      // Reset to actual pathname when navigation completes
      setInstantPathname(pathname);
    };

    window.addEventListener('instant-nav-start', handleNavStart as EventListener);
    window.addEventListener('instant-nav-end', handleNavEnd);

    return () => {
      window.removeEventListener('instant-nav-start', handleNavStart as EventListener);
      window.removeEventListener('instant-nav-end', handleNavEnd);
    };
  }, [pathname]);

  return instantPathname;
}

export function useInstantNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    setIsNavigating(false);
    setNavigatingTo(null);
    window.dispatchEvent(new CustomEvent('instant-nav-end'));
  }, [pathname]);

  const navigateInstantly = useCallback((href: string) => {
    if (!href.startsWith('/')) return;
    if (href === pathname) return;
    
    setIsNavigating(true);
    setNavigatingTo(href);
    
    // Dispatch loading start event with the target path
    window.dispatchEvent(new CustomEvent('instant-nav-start', { detail: { href } }));
    
    // Update URL instantly
    window.history.pushState(null, '', href);
    
    // Trigger navigation in a transition for progressive loading
    startTransition(() => {
      router.push(href);
    });
  }, [router, pathname]);

  const replaceInstantly = useCallback((href: string) => {
    if (!href.startsWith('/')) return;
    if (href === pathname) return;
    
    setIsNavigating(true);
    setNavigatingTo(href);
    
    // Dispatch loading start event with the target path
    window.dispatchEvent(new CustomEvent('instant-nav-start', { detail: { href } }));
    
    // Update URL instantly
    window.history.replaceState(null, '', href);
    
    // Trigger navigation in a transition for progressive loading
    startTransition(() => {
      router.replace(href);
    });
  }, [router, pathname]);

  return {
    navigateInstantly,
    replaceInstantly,
    isPending,
    isNavigating: isNavigating || isPending,
    navigatingTo,
  };
} 