"use client";

import { createContext, useContext, ReactNode } from "react";
import { useModelManager } from "@/hooks/useModelManager";

type ModelManagerContextType = ReturnType<typeof useModelManager>;

const ModelManagerContext = createContext<ModelManagerContextType | undefined>(
  undefined
);

export function ModelManagerProvider({ children }: { children: ReactNode }) {
  const modelManager = useModelManager();

  return (
    <ModelManagerContext.Provider value={modelManager}>
      {children}
    </ModelManagerContext.Provider>
  );
}

export function useModelManagerContext() {
  const context = useContext(ModelManagerContext);
  if (context === undefined) {
    throw new Error(
      "useModelManagerContext must be used within a ModelManagerProvider"
    );
  }
  return context;
} 