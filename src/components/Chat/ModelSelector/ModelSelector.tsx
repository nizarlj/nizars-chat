"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronsUpDown, ArrowUpDown } from "lucide-react";
import { 
  getProviderDefinition,
  type SupportedModelId
} from "@/lib/models";
import { useChatContext } from "../ChatLayout";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProviderIcon from "../ProviderIcon";
import { ModelItem, ModelNameDisplay, organizeModels, getSortLabel, type SortOption } from ".";

export default function ModelSelector() {
  const { selectedModel, selectModel } = useChatContext();
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('provider');

  const selectedProvider = useMemo(() => getProviderDefinition(selectedModel.provider), [selectedModel.provider]);

  const handleModelSelect = useCallback((modelId: SupportedModelId) => {
    selectModel(modelId);
    setOpen(false);
  }, [selectModel]);

  // Sort and group models based on selected criteria
  const organizedModels = useMemo(() => organizeModels(sortBy), [sortBy]);

  // Global keyboard shortcut to open model selector
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const cycleSortOption = useCallback(() => {
    const options: SortOption[] = ['provider', 'name', 'capabilities'];
    const currentIndex = options.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % options.length;
    setSortBy(options[nextIndex]);
  }, [sortBy]);

  return (
    <TooltipProvider delayDuration={300}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={`Select a model. Current: ${selectedModel.name}. Press Ctrl+M to open`}
            className="w-auto min-w-[200px] justify-between"
          >
            <div className="flex items-center space-x-2">
              <ProviderIcon provider={selectedProvider.id} size="md" />
              <ModelNameDisplay model={selectedModel} />
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <div className="flex items-center px-3 py-2">
              <div className="flex-1">
                <CommandInput placeholder="Search models... (Type to filter)" className="flex-1 h-8 border-0 shadow-none outline-none ring-0" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-28 h-8 text-xs ml-2 flex-shrink-0 justify-start"
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
            <CommandList className="!max-h-none h-[600px] overflow-y-auto">
              <CommandEmpty>No model found. Try adjusting your search.</CommandEmpty>
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
    </TooltipProvider>
  );
} 