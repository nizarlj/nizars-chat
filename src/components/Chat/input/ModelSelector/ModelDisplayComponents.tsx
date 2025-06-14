import { memo, useMemo } from "react";
import { Info } from "lucide-react";
import { 
  getModelCapabilities,
  getModelFlags,
  type Model,
} from "@/lib/models";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatContextWindow } from "./model-utils";

export const ModelNameDisplay = memo(({ model }: { model: Model }) => {
  return (
    <div className="flex items-center space-x-1">
      <span className="font-medium">{model.name}</span>
      {model.subtitle && (
        <span className="text-xs text-muted-foreground">({model.subtitle})</span>
      )}
    </div>
  );
});
ModelNameDisplay.displayName = "ModelNameDisplay";

export const ModelFlags = memo(({ model }: { model: Model }) => {
  const modelFlags = useMemo(() => getModelFlags(model), [model]);
  
  if (modelFlags.length === 0) return null;

  return (
    <div className="flex items-center space-x-1">
      {modelFlags.map((flag) => {
        const Icon = flag.icon;
        
        return (
          <Tooltip key={flag.id}>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Icon className={cn("h-3 w-3", flag.color)} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs font-medium">{flag.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});
ModelFlags.displayName = "ModelFlags";

export const ModelInfo = memo(({ model }: { model: Model }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[300px]">
        <p className="text-sm font-medium">{model.description}</p>
        {model.capabilities.contextWindow && (
          <p className="text-xs text-muted-foreground mt-1">
            Context: {formatContextWindow(model.capabilities.contextWindow)}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
});
ModelInfo.displayName = "ModelInfo";

export const CapabilityIcons = memo(({ model }: { model: Model }) => {
  const capabilities = useMemo(() => getModelCapabilities(model), [model]);
  
  if (capabilities.length === 0) return null;

  return (
    <div className="flex items-center space-x-1 ml-auto">
      {capabilities.map((capability) => {
        const Icon = capability.icon;
        return (
          <Tooltip key={capability.id}>
            <TooltipTrigger asChild>
              <span className={cn("inline-flex rounded-md p-1", capability.backgroundColor)}>
                <Icon 
                  className={cn("h-3 w-3", capability.textColor)} 
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs font-medium">{capability.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});
CapabilityIcons.displayName = "CapabilityIcons"; 