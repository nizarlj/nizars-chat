"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronsUpDown, ArrowUpDown, Star } from "lucide-react";
import { 
  getProviderDefinition,
  type SupportedModelId
} from "@/lib/models";
import { useChatConfig } from "@/components/Chat/context";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModelItem, ModelNameDisplay, organizeModels, getSortLabel, type SortOption } from ".";
import { ProviderIcon } from "@/components/Chat/shared";
import { cn, scrollbarStyle } from "@/lib/utils";
import { useUserPreferences } from "@/components/Providers/UserPreferencesProvider";

interface ModelSelectorProps {
  enableKeybinding?: boolean;
}

export default function ModelSelector({ enableKeybinding = false }: ModelSelectorProps) {
  const { selectedModel, selectModel } = useChatConfig();
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('provider');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const preferences = useUserPreferences();
  const isMobile = useIsMobile();

  const selectedProvider = useMemo(() => getProviderDefinition(selectedModel.provider), [selectedModel.provider]);

  const handleModelSelect = useCallback((modelId: SupportedModelId) => {
    selectModel(modelId);
    setOpen(false);
  }, [selectModel]);

  // Sort and group models based on selected criteria
  const organizedModels = useMemo(() => organizeModels(sortBy, preferences, showOnlyFavorites), [sortBy, preferences, showOnlyFavorites]);

  // Global keyboard shortcut to open model selector
  useEffect(() => {
    if (!enableKeybinding) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableKeybinding]);

  const cycleSortOption = useCallback(() => {
    const options: SortOption[] = ['provider', 'name', 'capabilities'];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
  }, [sortBy]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Select a model. Current: ${selectedModel.name}. Press Ctrl+M to open model selector`}
          size={isMobile ? "sm" : "default"}
          className={cn(
            "w-auto justify-between",
            // isMobile && "overflow-hidden"
          )}
        >
          <div className="flex items-center space-x-2 truncate">
            <ProviderIcon provider={selectedProvider.id} size="md" />
            <ModelNameDisplay model={selectedModel} />
          </div>
          <ChevronsUpDown className={cn("shrink-0 opacity-50", isMobile ? "ml-1 h-3 w-3" : "ml-2 h-4 w-4")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(isMobile ? "w-[320px]" : "w-[500px]", "p-0")} align="start">
        <Command>
          <div className="flex items-center px-3 py-2 border-b">
            <div className="flex-1 border-r">
              <CommandInput placeholder="Search models..." wrapperClassName="border-0" />
            </div>
            <div className="flex items-center ml-2 gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showOnlyFavorites ? "default" : "ghost"} 
                    size="sm" 
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  >
                    <Star className={cn("h-4 w-4", showOnlyFavorites && "fill-current")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{showOnlyFavorites ? "Show all models" : "Show only favorites"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-8 text-xs flex-shrink-0 justify-start",
                      isMobile ? "w-20" : "w-28"
                    )}
                    onClick={cycleSortOption}
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    {getSortLabel(sortBy)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Click to change sort order</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <CommandList className={cn(
            "!max-h-none overflow-y-auto p-2", 
            isMobile ? "h-[400px]" : "h-[600px]",
            scrollbarStyle
          )}>
            <CommandEmpty>
              {showOnlyFavorites 
                ? "No favorite models found. Add some models to favorites in Settings or disable the favorites filter."
                : "No model found. Try adjusting your search."
              }
            </CommandEmpty>
            {organizedModels.type === 'grouped' ? (
              Object.entries(organizedModels.groups).map(([providerName, models]) => (
                <CommandGroup key={providerName} heading={providerName}>
                  {models.map((model) => (
                    <ModelItem
                      key={model.id}
                      model={model}
                      onSelect={() => handleModelSelect(model.id as SupportedModelId)}
                      isSelected={model.id === selectedModel.id}
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
                  isSelected={model.id === selectedModel.id}
                />
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 