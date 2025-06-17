"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModelCapabilities, getModelFlags, type Model } from "@/lib/models";
import ModelProperty from "@/components/Chat/shared/ModelProperty";

interface ModelPreferenceItemProps {
  model: Model;
  isDisabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: (modelId: string) => void;
  onToggleEnabled: (modelId: string) => void;
}

export const ModelPreferenceItem = memo(function ModelPreferenceItem({
  model,
  isDisabled,
  isFavorite,
  onToggleFavorite,
  onToggleEnabled,
}: ModelPreferenceItemProps) {
  const capabilities = getModelCapabilities(model);
  const flags = getModelFlags(model);

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg transition-colors",
        isDisabled ? "opacity-50 bg-muted/50" : "hover:bg-muted/50"
      )}
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-center gap-2">
            <h4 className="font-medium">{model.name}</h4>
            {model.subtitle && (
              <span className="text-xs text-muted-foreground">
                {model.subtitle}
              </span>
            )}
            {model.isDefault && (
              <Badge style="outline" color="default" className="text-xs">
                Default
              </Badge>
            )}
          </div>
          
          {flags.map((flag) => (
            <ModelProperty
              key={flag.id}
              property={flag}
            />
          ))}
        </div>

        <p className="text-sm text-muted-foreground">{model.description}</p>

        {capabilities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {capabilities.map((capability) => (
              <ModelProperty
                key={capability.id}
                property={capability}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 ml-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleFavorite(model.id)}
          className={cn(
            "p-2",
            isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground"
          )}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>

        <Button
          style={isDisabled ? "solid" : "outline"}
          className="w-20 border-1"
          size="sm"
          onClick={() => onToggleEnabled(model.id)}
        >
          {isDisabled ? "Enable" : "Disable"}
        </Button>
      </div>
    </div>
  );
});

ModelPreferenceItem.displayName = "ModelPreferenceItem"; 