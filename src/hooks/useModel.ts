"use client";

import { useState, useCallback, useMemo, useRef } from 'react';
import { getDefaultModel, getModelById, SupportedModelId } from '@/lib/models';
import { ModelParams } from '@convex/schema';

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  temperature: undefined,
  topP: undefined,
  topK: undefined,
  maxTokens: undefined,
  presencePenalty: undefined,
  frequencyPenalty: undefined,
  seed: undefined,
  reasoningEffort: 'medium',
  includeSearch: false,
};

interface UseModelOptions {
  initialModelId?: SupportedModelId;
}

export function useModel(options?: UseModelOptions) {
  const [selectedModelId, setSelectedModelId] = useState<SupportedModelId>(
    options?.initialModelId || getDefaultModel().id
  );
  const [modelParams, setModelParams] = useState<ModelParams>(DEFAULT_MODEL_PARAMS);
  
  // Track the last thread model to prevent unnecessary updates
  const lastThreadModelRef = useRef<string | null>(null);

  const selectedModel = useMemo(() => getModelById(selectedModelId), [selectedModelId]);

  const selectModel = useCallback((modelId: SupportedModelId) => {
    const model = getModelById(modelId);
    if (model) {
      setSelectedModelId(modelId);
    }
  }, []);

  const syncWithThread = useCallback((threadModel: string | null) => {
    // If no thread model, reset to default
    if (!threadModel) {
      if (lastThreadModelRef.current !== null) {
        setSelectedModelId(getDefaultModel().id);
        setModelParams(DEFAULT_MODEL_PARAMS);
        lastThreadModelRef.current = null;
      }
      return;
    }

    // Only update if the thread model has actually changed
    if (threadModel === lastThreadModelRef.current) return

    // Try to set the model from thread, fallback to default if invalid
    try {
      const model = getModelById(threadModel as SupportedModelId);
      if (model) {
        setSelectedModelId(threadModel as SupportedModelId);
      } else {
        setSelectedModelId(getDefaultModel().id);
      }
    } catch {
      setSelectedModelId(getDefaultModel().id);
    }
    
    lastThreadModelRef.current = threadModel;
  }, []);

  const resetToDefault = useCallback(() => {
    setSelectedModelId(getDefaultModel().id);
    setModelParams(DEFAULT_MODEL_PARAMS);
    lastThreadModelRef.current = null;
  }, []);

  const updateParam = useCallback(<K extends keyof ModelParams>(
    key: K, 
    value: ModelParams[K]
  ) => {
    setModelParams(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetParams = useCallback(() => {
    setModelParams(DEFAULT_MODEL_PARAMS);
  }, []);

  return {
    selectedModelId,
    selectedModel,
    selectModel,
    syncWithThread,
    resetToDefault,
    modelParams,
    updateParam,
    resetParams,
    setModelParams,
    // Expose this for checking if we need to update the thread
    lastThreadModel: lastThreadModelRef.current,
  };
} 