import { memo, useMemo } from "react";
import { Info } from "lucide-react";
import { 
  getModelCapabilities,
  getModelFlags,
  type Model,
} from "@/lib/models";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatContextWindow } from "./model-utils";
import ModelProperty from "@/components/Chat/shared/ModelProperty";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const ModelNameDisplay = memo(({ model }: { model: Model }) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("flex items-center space-x-1", isMobile && "flex-col items-start")}>
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
    <div className="flex items-center">
      {modelFlags.map((flag) => {
        return (
          <ModelProperty key={flag.id} property={flag} iconOnly enableBackground={false} />
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
        return (
          <ModelProperty key={capability.id} property={capability} iconOnly />
        );
      })}
    </div>
  );
});
CapabilityIcons.displayName = "CapabilityIcons"; 