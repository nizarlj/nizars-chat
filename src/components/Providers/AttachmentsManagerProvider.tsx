"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAttachmentsManager } from "@/hooks/useAttachmentsManager";

type AttachmentsManagerContextType = ReturnType<typeof useAttachmentsManager>;

const AttachmentsManagerContext = createContext<
  AttachmentsManagerContextType | undefined
>(undefined);

export function AttachmentsManagerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const attachmentsManager = useAttachmentsManager();

  return (
    <AttachmentsManagerContext.Provider value={attachmentsManager}>
      {children}
    </AttachmentsManagerContext.Provider>
  );
}

export function useAttachmentsManagerContext() {
  const context = useContext(AttachmentsManagerContext);
  if (context === undefined) {
    throw new Error(
      "useAttachmentsManagerContext must be used within a AttachmentsManagerProvider"
    );
  }
  return context;
} 