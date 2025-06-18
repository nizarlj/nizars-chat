'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Id } from '@convex/_generated/dataModel';

export type DataPart = 
  | { type: 'thread-created'; id: string };

export interface Props {
  autoResume: boolean;
  experimental_resume: UseChatHelpers['experimental_resume'];
  status: UseChatHelpers['status'];
  threadId?: Id<'threads'>;
}

export function useAutoResume({
  autoResume,
  experimental_resume,
  status,
  threadId
}: Props) {
  const hasResumedRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Memoize the resume function to prevent unnecessary re-renders
  const stableResume = useCallback(() => {
    if (hasResumedRef.current) return;
    
    hasResumedRef.current = true;
    experimental_resume();
    
    resumeTimeoutRef.current = setTimeout(() => {
      hasResumedRef.current = false;
    }, 5000); // 5 second cooldown
  }, [experimental_resume]);

  useEffect(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }

    if (
      autoResume && 
      threadId && 
      !initializedRef.current && 
      status !== 'streaming' && 
      !hasResumedRef.current
    ) {
      console.log('Initial load with streaming status - resume immediately');
      stableResume();
    }

    initializedRef.current = true;
  }, [autoResume, threadId, status, stableResume]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);
}