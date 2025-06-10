'use client';

import { useEffect } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';

export type DataPart = 
  | { type: 'thread-created'; id: string };

export interface Props {
  autoResume: boolean;
  experimental_resume: UseChatHelpers['experimental_resume'];
  threadId: string;
  messagesLoaded: boolean;
}

export function useAutoResume({
  autoResume,
  experimental_resume,
  threadId,
  messagesLoaded,
}: Props) {
  useEffect(() => {
    if (autoResume && messagesLoaded) {
      console.log("autoResume", threadId);
      experimental_resume();
    }
    // This effect should only run when messages are loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesLoaded]);
}