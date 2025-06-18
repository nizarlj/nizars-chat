import { UserPreferences } from "@/components/Providers/UserPreferencesProvider";
import { 
  MODELS, 
  getModelCapabilities,
  getProviderDefinition,
  type Model,
} from "@/lib/models";

export type SortOption = "provider" | "name" | "capabilities";

export function formatContextWindow(contextWindow: number): string {
  if (contextWindow >= 1000000) {
    return `${(contextWindow / 1000000).toFixed(1)}M tokens`;
  }
  return `${(contextWindow / 1000).toFixed(0)}K tokens`;
}

export function getSortLabel(sort: SortOption): string {
  switch (sort) {
    case "name": return "Name";
    case "provider": return "Provider";
    case "capabilities": return "Capabilities";
    default: return "Provider";
  }
}

export function organizeModels(sortBy: SortOption, preferences: UserPreferences, showOnlyFavorites: boolean = false) {
  const favoriteModels = new Set(preferences?.favoriteModels || []);
  let sortedModels = [...MODELS].filter(model => !preferences?.disabledModels?.includes(model.id));
  
  // Filter to only favorites if requested
  if (showOnlyFavorites) {
    sortedModels = sortedModels.filter(model => favoriteModels.has(model.id));
  }
  
  // Sort models within each category
  const sortFunction = (a: Model, b: Model) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "capabilities":
        const aCapabilities = getModelCapabilities(a).length;
        const bCapabilities = getModelCapabilities(b).length;
        return bCapabilities - aCapabilities;
      case "provider":
      default:
        const providerCompare = a.provider.localeCompare(b.provider);
        if (providerCompare === 0) {
          return a.name.localeCompare(b.name);
        }
        return providerCompare;
    }
  };

  // If showing only favorites, just sort them. Otherwise, prioritize favorites.
  let finalSortedModels: Model[];
  
  if (showOnlyFavorites) {
    sortedModels.sort(sortFunction);
    finalSortedModels = sortedModels;
  } else {
    // Separate favorites and non-favorites
    const favorites = sortedModels.filter(model => favoriteModels.has(model.id));
    const nonFavorites = sortedModels.filter(model => !favoriteModels.has(model.id));
    
    // Sort each group
    favorites.sort(sortFunction);
    nonFavorites.sort(sortFunction);
    
    // Combine with favorites first
    finalSortedModels = [...favorites, ...nonFavorites];
  }

  if (sortBy === "provider") {
    // Group by provider, but maintain favorites at top within each group
    const groups: Record<string, Model[]> = {};
    finalSortedModels.forEach(model => {
      const providerName = getProviderDefinition(model.provider).name;
      if (!groups[providerName]) {
        groups[providerName] = [];
      }
      groups[providerName].push(model);
    });
    
    // Within each group, sort to have favorites first (unless showing only favorites)
    if (!showOnlyFavorites) {
      Object.keys(groups).forEach(providerName => {
        const groupModels = groups[providerName];
        const groupFavorites = groupModels.filter(model => favoriteModels.has(model.id));
        const groupNonFavorites = groupModels.filter(model => !favoriteModels.has(model.id));
        groups[providerName] = [...groupFavorites, ...groupNonFavorites];
      });
    }
    
    return { type: "grouped" as const, groups };
  } else {
    // Return flat list for other sorting options
    return { type: "flat" as const, models: finalSortedModels };
  }
} 