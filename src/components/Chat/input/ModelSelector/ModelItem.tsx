import { memo, useMemo } from "react";
import { 
  getProviderDefinition,
  type Model,
} from "@/lib/models";
import { cn } from "@/lib/utils";
import { CommandItem } from "@/components/ui/command";
import { ProviderIcon } from ".";
import {
  ModelNameDisplay,
  ModelFlags,
  ModelInfo,
  CapabilityIcons,
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
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <ProviderIcon provider={modelProvider.id} size="sm" />
        <ModelNameDisplay model={model} />
        <ModelFlags model={model} />
        <ModelInfo model={model} />
      </div>
      <CapabilityIcons model={model} />
    </CommandItem>
  );
});
ModelItem.displayName = "ModelItem";

export default ModelItem; 