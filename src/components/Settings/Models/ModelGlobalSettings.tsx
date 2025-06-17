"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { ProviderIcon } from "@/components/Chat/shared";
import { ModelFilters } from "./ModelFilters";
import { useModelManagerContext } from "@/components/Providers/ModelManagerProvider";

export function ModelGlobalSettings() {
  const {
    useOpenRouterForAll,
    toggleOpenRouterForAll,
    resetToDefaults,
  } = useModelManagerContext();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Model Preferences</CardTitle>
        </div>
        <CardDescription>
          Enable/disable models and mark favorites to customize your model selector
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OpenRouter Global Setting */}
        <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ProviderIcon provider="openrouter" size="sm" />
              <p className="text-sm font-medium">Use OpenRouter for All Models</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Route all model requests through OpenRouter when you have an OpenRouter API key
            </p>
          </div>
          <Switch
            checked={useOpenRouterForAll}
            onCheckedChange={toggleOpenRouterForAll}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium">Quick Actions</p>
            <p className="text-xs text-muted-foreground">
              Disabled models won&apos;t appear in the model selector
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>

        {/* Filters */}
        <ModelFilters />
      </CardContent>
    </Card>
  );
} 