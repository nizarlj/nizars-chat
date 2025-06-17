"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { MODELS } from "@/lib/models";
import { useUserPreferences } from "@/components/Providers/UserPreferencesProvider";

export function useModelManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedCapability, setSelectedCapability] = useState<string>("all");
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // User preferences from context
  const userPreferences = useUserPreferences();
  const updateUserPreferences = useMutation(api.userPreferences.updateUserPreferences)
    .withOptimisticUpdate((localStore, args) => {
      const currentValue = localStore.getQuery(api.userPreferences.getUserPreferences, {});
      if (currentValue) {
        const newValue = { ...currentValue };
        if (args.useOpenRouterForAll !== undefined) {
          newValue.useOpenRouterForAll = args.useOpenRouterForAll;
        }
        if (args.disabledModels !== undefined) {
          newValue.disabledModels = args.disabledModels;
        }
        if (args.favoriteModels !== undefined) {
          newValue.favoriteModels = args.favoriteModels;
        }
        localStore.setQuery(api.userPreferences.getUserPreferences, {}, newValue);
      }
    });

  // Derived state
  const disabledModels = useMemo(() => new Set(userPreferences?.disabledModels || []), [userPreferences?.disabledModels]);
  const favoriteModels = useMemo(() => new Set(userPreferences?.favoriteModels || []), [userPreferences?.favoriteModels]);
  const useOpenRouterForAll = userPreferences?.useOpenRouterForAll || false;

  // Actions
  const toggleModelEnabled = (modelId: string) => {
    const newDisabled = new Set(disabledModels);
    if (newDisabled.has(modelId)) {
      newDisabled.delete(modelId);
    } else {
      newDisabled.add(modelId);
    }
    updateUserPreferences({ disabledModels: Array.from(newDisabled) });
  };

  const toggleModelFavorite = (modelId: string) => {
    const newFavorites = new Set(favoriteModels);
    if (newFavorites.has(modelId)) {
      newFavorites.delete(modelId);
    } else {
      newFavorites.add(modelId);
    }
    updateUserPreferences({ favoriteModels: Array.from(newFavorites) });
  };

  const toggleOpenRouterForAll = (enabled: boolean) => {
    updateUserPreferences({ useOpenRouterForAll: enabled });
  };

  const resetToDefaults = () => {
    updateUserPreferences({ 
      disabledModels: [], 
      favoriteModels: [],
      useOpenRouterForAll: false 
    });
  };

  // Filter models based on search and filters
  const filteredModels = useMemo(() => {
    return MODELS.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (model.subtitle && model.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesProvider = selectedProvider === "all" || model.provider === selectedProvider;
      
      const matchesCapability = selectedCapability === "all" || 
                               model.capabilities[selectedCapability as keyof typeof model.capabilities];
      
      const matchesEnabled = !showOnlyEnabled || !disabledModels.has(model.id);
      
      const matchesFavorites = !showOnlyFavorites || favoriteModels.has(model.id);

      return matchesSearch && matchesProvider && matchesCapability && matchesEnabled && matchesFavorites;
    });
  }, [searchQuery, selectedProvider, selectedCapability, showOnlyEnabled, showOnlyFavorites, disabledModels, favoriteModels]);

  // Group filtered models by provider
  const modelsByProvider = useMemo(() => {
    return filteredModels.reduce((acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, typeof MODELS>);
  }, [filteredModels]);

  return {
    // State
    searchQuery,
    selectedProvider,
    selectedCapability,
    showOnlyEnabled,
    showOnlyFavorites,
    userPreferences,
    disabledModels,
    favoriteModels,
    useOpenRouterForAll,
    
    // Derived data
    filteredModels,
    modelsByProvider,
    
    // Actions
    setSearchQuery,
    setSelectedProvider,
    setSelectedCapability,
    setShowOnlyEnabled,
    setShowOnlyFavorites,
    toggleModelEnabled,
    toggleModelFavorite,
    toggleOpenRouterForAll,
    resetToDefaults,
  };
} 