"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronsUpDown, RotateCcw } from "lucide-react";
import { 
  type SupportedModelId,
  getModelById
} from "@/lib/models";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModelItem, organizeModels } from "@/components/Chat/input/ModelSelector";
import { cn, scrollbarStyle } from "@/lib/utils";

interface RetryModelSelectorProps {
  currentModelId?: string;
  onRetry: (modelId: SupportedModelId) => void;
  className?: string;
  variant?: "default" | "error";
}

export default function RetryModelSelector({ 
  currentModelId, 
  onRetry, 
  className,
  variant = "default"
}: RetryModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentModel = useMemo(() => {
    if (!currentModelId) return null;
    try {
      return getModelById(currentModelId as SupportedModelId);
    } catch {
      return null;
    }
  }, [currentModelId]);

  const handleModelSelect = useCallback((modelId: SupportedModelId) => {
    onRetry(modelId);
    setOpen(false);
  }, [onRetry]);

  const handleRetrySameModel = useCallback(() => {
    if (currentModel) {
      onRetry(currentModel.id);
    }
  }, [currentModel, onRetry]);

  const organizedModels = useMemo(() => organizeModels('provider'), []);

  const isErrorVariant = variant === "error";
  const buttonVariant = isErrorVariant ? "outline" : "ghost";
  const buttonClassName = isErrorVariant 
    ? "text-xs gap-1 border-destructive/20 hover:bg-destructive/10" 
    : "text-xs text-muted-foreground hover:text-foreground";
  const triggerClassName = isErrorVariant
    ? "text-xs gap-1 border-destructive/20 hover:bg-destructive/10 px-2"
    : "text-xs text-muted-foreground hover:text-foreground px-2";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Retry with same model button */}
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={handleRetrySameModel}
        className={buttonClassName}
        title={`Retry with ${currentModel?.name || 'same model'}`}
      >
        <RotateCcw className="h-3 w-3" />
        {isErrorVariant && "Retry"}
      </Button>

      {/* Model selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={buttonVariant}
            size="sm"
            className={triggerClassName}
            title="Retry with different model"
          >
            <ChevronsUpDown className="h-3 w-3" />
            {isErrorVariant && "Retry with different model"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="px-3 py-2 border-b">
              <CommandInput placeholder="Search models..." wrapperClassName="border-0" />
            </div>
            <CommandList className={cn("!max-h-none h-[400px] overflow-y-auto p-2", scrollbarStyle)}>
              <CommandEmpty>No model found.</CommandEmpty>
              {organizedModels.type === 'grouped' ? (
                Object.entries(organizedModels.groups).map(([providerName, models]) => (
                  <CommandGroup key={providerName} heading={providerName}>
                    {models.map((model) => (
                      <ModelItem
                        key={model.id}
                        model={model}
                        onSelect={() => handleModelSelect(model.id as SupportedModelId)}
                        isSelected={model.id === currentModelId}
                      />
                    ))}
                  </CommandGroup>
                ))
              ) : (
                organizedModels.models.map((model) => (
                  <ModelItem
                    key={model.id}
                    model={model}
                    onSelect={() => handleModelSelect(model.id as SupportedModelId)}
                    isSelected={model.id === currentModelId}
                  />
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 