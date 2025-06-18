'use client';

import { useEffect } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';

export type DataPart = 
  | { type: 'thread-created'; id: string };

export interface Props {
  autoResume: boolean;
  experimental_resume: UseChatHelpers['experimental_resume'];
  threadId: string;
}

export function useAutoResume({
  autoResume,
  experimental_resume,
  threadId,
}: Props) {
  useEffect(() => {
    if (autoResume) experimental_resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);
}