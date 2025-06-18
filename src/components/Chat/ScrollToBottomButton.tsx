"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  messagesCount: number;
}

export default function ScrollToBottomButton({ messagesCount }: ScrollToBottomButtonProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingProgrammatically = useRef(false);
  const isFollowingRef = useRef(true);

  const checkPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceFromBottom < 50;
    
    setIsAtBottom(atBottom);
    setShowButton(!atBottom && messagesCount > 0);
  }, [messagesCount]);

  const scrollToBottomAndFollow = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    isScrollingProgrammatically.current = true;
    container.scrollTo({ 
      top: container.scrollHeight, 
      behavior: 'auto'
    });
    
    setIsFollowing(true);
    isFollowingRef.current = true;
    setShowButton(false);
    
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 100);
  }, []);

  // Find scroll container and set up all observers
  useEffect(() => {
    let container: HTMLElement | null = containerRef.current;
    while (container && !container.classList.contains('overflow-y-auto')) {
      container = container.parentElement;
    }
    if (!container) return;
    
    scrollContainerRef.current = container;

    const onUserScroll = () => {
      if (!isScrollingProgrammatically.current) {
        setIsFollowing(false);
        isFollowingRef.current = false;
      }
    };

    const onScroll = () => {
      // If we're following and not programmatically scrolling, check if user scrolled away
      if (isFollowingRef.current && !isScrollingProgrammatically.current) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        
        // If user is ANY distance from bottom, stop following
        if (distanceFromBottom > 5) { // Very small threshold
          setIsFollowing(false);
          isFollowingRef.current = false;
        }
      }
      checkPosition();
    };

    // Set up event listeners
    container.addEventListener('wheel', onUserScroll, { passive: true });
    container.addEventListener('touchstart', onUserScroll, { passive: true });
    container.addEventListener('scroll', onScroll, { passive: true });

    // Set up MutationObserver to watch for content changes
    const mutationObserver = new MutationObserver(() => {
      if (isFollowingRef.current) {
        // If we're following, immediately scroll to bottom when content changes
        isScrollingProgrammatically.current = true;
        requestAnimationFrame(() => {
          container.scrollTo({ 
            top: container.scrollHeight, 
            behavior: 'auto'
          });
          setTimeout(() => {
            isScrollingProgrammatically.current = false;
          }, 50);
        });
      }
      checkPosition();
    });

    // Set up ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      if (isFollowingRef.current) {
        // If we're following, immediately scroll to bottom when size changes
        isScrollingProgrammatically.current = true;
        requestAnimationFrame(() => {
          container.scrollTo({ 
            top: container.scrollHeight, 
            behavior: 'auto'
          });
          setTimeout(() => {
            isScrollingProgrammatically.current = false;
          }, 50);
        });
      }
      checkPosition();
    });

    // Observe the container and its children for changes
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: true
    });

    resizeObserver.observe(container);

    // Initial check
    checkPosition();

    return () => {
      container.removeEventListener('wheel', onUserScroll);
      container.removeEventListener('touchstart', onUserScroll);
      container.removeEventListener('scroll', onScroll);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [checkPosition]);

  // Handle auto-scrolling when in follow mode
  useEffect(() => {
    if (!isFollowing) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    isScrollingProgrammatically.current = true;
    
    // Use requestAnimationFrame to ensure we scroll after DOM updates
    requestAnimationFrame(() => {
      container.scrollTo({ 
        top: container.scrollHeight, 
        behavior: 'auto' // Use 'auto' for instant following during streaming
      });
      
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 50);
    });
  }, [messagesCount, isFollowing]);

  if (!showButton) {
    return <div ref={containerRef} className="absolute invisible" />;
  }

  return (
    <>
      <div ref={containerRef} className="absolute invisible" />
      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-full mb-4 z-10">
        <Button
          size="sm"
          style="soft"
          onClick={scrollToBottomAndFollow}
          className="mb-4 rounded-full shadow-lg transition-all duration-200 bg-accent border border-border text-foreground hover:bg-card"
        >
          <ChevronDown className="h-4 w-4 mr-1" />
          Scroll to bottom
        </Button>
      </div>
    </>
  );
} 