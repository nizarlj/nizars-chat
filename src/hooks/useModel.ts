"use client";

import { useState, useCallback, useMemo } from 'react';
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

export function useModel() {
  const [selectedModelId, setSelectedModelId] = useState<SupportedModelId>(getDefaultModel().id);
  const [modelParams, setModelParams] = useState<ModelParams>(DEFAULT_MODEL_PARAMS);

  const selectedModel = useMemo(() => getModelById(selectedModelId), [selectedModelId]);

  const selectModel = useCallback((modelId: SupportedModelId) => {
    const model = getModelById(modelId);
    if (model) {
      setSelectedModelId(modelId);
    }
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
    modelParams,
    updateParam,
    resetParams,
    setModelParams,
  };
} 