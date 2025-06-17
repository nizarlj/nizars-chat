"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Search, Filter, ChevronDown, X } from "lucide-react";
import { PROVIDER_DEFINITIONS, PROVIDER_LOOKUP, CAPABILITY_DEFINITIONS, CAPABILITY_LOOKUP, ProviderKey, CapabilityKey, MODELS } from "@/lib/models";
import { ProviderIcon } from "@/components/Chat/shared";
import { cn } from "@/lib/utils";
import ModelProperty from "@/components/Chat/shared/ModelProperty";
import { useModelManagerContext } from "@/components/Providers/ModelManagerProvider";

export function ModelFilters() {
  const {
    searchQuery,
    setSearchQuery,
    selectedProvider,
    setSelectedProvider,
    selectedCapability,
    setSelectedCapability,
    showOnlyEnabled,
    setShowOnlyEnabled,
    showOnlyFavorites,
    setShowOnlyFavorites,
    filteredModels,
  } = useModelManagerContext();

  const filteredModelsCount = filteredModels.length;
  const totalModelsCount = MODELS.length;

  const hasActiveQuickFilters = showOnlyEnabled || showOnlyFavorites;
  const quickFilterCount = (showOnlyEnabled ? 1 : 0) + (showOnlyFavorites ? 1 : 0);

  const clearQuickFilters = () => {
    setShowOnlyEnabled(false);
    setShowOnlyFavorites(false);
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Filters</Label>
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {filteredModelsCount} of {totalModelsCount} models
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {/* Search */}
        <div className="col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Filter Toggles */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-between">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span>Quick Filters</span>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs transition-opacity",
                  hasActiveQuickFilters ? "opacity-100" : "opacity-0"
                )}
              >
                {quickFilterCount}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Filters</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled" className="text-sm">Show only enabled</Label>
                    <Switch
                      id="enabled"
                      checked={showOnlyEnabled}
                      onCheckedChange={setShowOnlyEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="favorites" className="text-sm">Show only favorites</Label>
                    <Switch
                      id="favorites"
                      checked={showOnlyFavorites}
                      onCheckedChange={setShowOnlyFavorites}
                    />
                  </div>
                </div>
              </div>
              {hasActiveQuickFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearQuickFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Provider Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="col-span-2">
              {selectedProvider === "all" ? "Provider" : PROVIDER_LOOKUP[selectedProvider as ProviderKey]?.name}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <div className="p-2">
              <div
                className={cn(
                  "flex items-center space-x-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent",
                  selectedProvider === "all" && "bg-accent"
                )}
                onClick={() => setSelectedProvider("all")}
              >
                <span>All Providers</span>
              </div>
              {PROVIDER_DEFINITIONS.map((provider) => (
                <div
                  key={provider.id}
                  className={cn(
                    "flex items-center space-x-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent",
                    selectedProvider === provider.id && "bg-accent"
                  )}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <ProviderIcon provider={provider.id as ProviderKey} size="sm" />
                  <span>{provider.name}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Capability Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="col-span-2">
              {selectedCapability === "all" ? "Capability" : CAPABILITY_LOOKUP[selectedCapability as CapabilityKey]?.name}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <div className="p-2 space-y-1">
              <div
                className={cn(
                  "px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent",
                  selectedCapability === "all" && "bg-accent"
                )}
                onClick={() => setSelectedCapability("all")}
              >
                All Capabilities
              </div>
              {CAPABILITY_DEFINITIONS.map((capability) => (
                <div
                  key={capability.id}
                  className={cn(
                    "flex items-center space-x-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent",
                    selectedCapability === capability.id && "bg-accent"
                  )}
                  onClick={() => setSelectedCapability(capability.id)}
                >
                  <ModelProperty property={capability} />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 