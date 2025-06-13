"use client";

import { createContext, useContext, useMemo } from "react";
import { ModelParams } from "@convex/schema";
import { getDefaultModel, Model, SupportedModelId } from "@/lib/models";
import { DEFAULT_MODEL_PARAMS } from "@/hooks/useModel";

interface ChatConfigContextType {
  selectedModel: Model;
  modelParams: ModelParams;
  selectModel: (modelId: SupportedModelId) => void;
  updateParam: <K extends keyof ModelParams>(key: K, value: ModelParams[K]) => void;
  resetParams: () => void;
}

const ChatConfigContext = createContext<ChatConfigContextType | null>(null);

export function useChatConfig() {
  const context = useContext(ChatConfigContext);
  const defaultModel = useMemo(() => getDefaultModel(), []);
  
  if (!context) {
    return {
      selectedModel: defaultModel,
      modelParams: DEFAULT_MODEL_PARAMS,
      selectModel: () => {},
      updateParam: () => {},
      resetParams: () => {},
    };
  }
  return context;
}

export { ChatConfigContext };
export type { ChatConfigContextType }; 