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

export function organizeModels(sortBy: SortOption, preferences: UserPreferences) {
  const sortedModels = [...MODELS].filter(model => !preferences?.disabledModels?.includes(model.id));
  
  switch (sortBy) {
    case "name":
      sortedModels.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "capabilities":
      sortedModels.sort((a, b) => {
        const aCapabilities = getModelCapabilities(a).length;
        const bCapabilities = getModelCapabilities(b).length;
        return bCapabilities - aCapabilities;
      });
      break;
    case "provider":
    default:
      sortedModels.sort((a, b) => {
        const providerCompare = a.provider.localeCompare(b.provider);
        if (providerCompare === 0) {
          return a.name.localeCompare(b.name);
        }
        return providerCompare;
      });
      break;
  }

  if (sortBy === "provider") {
    // Group by provider
    const groups: Record<string, Model[]> = {};
    sortedModels.forEach(model => {
      const providerName = getProviderDefinition(model.provider).name;
      if (!groups[providerName]) {
        groups[providerName] = [];
      }
      groups[providerName].push(model);
    });
    return { type: "grouped" as const, groups };
  } else {
    // Return flat list for other sorting options
    return { type: "flat" as const, models: sortedModels };
  }
} 