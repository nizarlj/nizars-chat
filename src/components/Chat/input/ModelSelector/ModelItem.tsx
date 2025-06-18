import { memo, useMemo } from "react";
import { Star } from "lucide-react";
import { 
  getProviderDefinition,
  type Model
} from "@/lib/models";
import { cn } from "@/lib/utils";
import { CommandItem } from "@/components/ui/command";
import { ProviderIcon } from "@/components/Chat/shared";
import { useUserPreferences } from "@/components/Providers/UserPreferencesProvider";
import {
  ModelNameDisplay,
  ModelFlags,
  ModelInfo,
  CapabilityIcons
} from "./ModelDisplayComponents";

interface ModelItemProps {
  model: Model; 
  onSelect: () => void; 
  isSelected?: boolean;
}

export const ModelItem = memo(({ 
  model, 
  onSelect,
  isSelected = false
}: ModelItemProps) => {
  const modelProvider = useMemo(() => getProviderDefinition(model.provider), [model.provider]);
  const preferences = useUserPreferences();
  const isFavorite = preferences?.favoriteModels?.includes(model.id) || false;
  
  return (
    <CommandItem
      key={model.id}
      value={`${model.name} ${model.subtitle || ""} ${model.description} ${model.provider}`}
      onSelect={onSelect}
      className={cn(
        "px-3 py-2 hover:cursor-pointer flex items-center justify-between w-full",
        isSelected && "bg-accent"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="flex items-center gap-3">
          <ProviderIcon provider={modelProvider.id} size="sm" />
          <ModelNameDisplay model={model} />
          {isFavorite && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </span>
        <span className="flex items-center gap-1">
          <ModelFlags model={model} />
          <ModelInfo model={model} />
        </span>
      </div>
      <CapabilityIcons model={model} />
    </CommandItem>
  );
});
ModelItem.displayName = "ModelItem";

export default ModelItem; 