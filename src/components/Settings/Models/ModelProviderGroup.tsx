"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProviderDefinition, Model, ProviderKey } from "@/lib/models";
import { ProviderIcon } from "@/components/Chat/shared";
import { ModelPreferenceItem } from "./ModelPreferenceItem";
import { useModelManagerContext } from "@/components/Providers/ModelManagerProvider";

interface ModelProviderGroupProps {
  providerId: string;
  models: Model[];
}

export function ModelProviderGroup({
  providerId,
  models,
}: ModelProviderGroupProps) {
  const { 
    disabledModels, 
    favoriteModels, 
    toggleModelFavorite, 
    toggleModelEnabled 
  } = useModelManagerContext();
  const provider = getProviderDefinition(providerId as ProviderKey);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ProviderIcon provider={provider.id} size="lg" />
          <div>
            <CardTitle className="text-lg">{provider.name}</CardTitle>
            <CardDescription>
              {models.length} model{models.length !== 1 ? 's' : ''} available
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.map((model) => (
          <ModelPreferenceItem
            key={model.id}
            model={model}
            isDisabled={disabledModels.has(model.id)}
            isFavorite={favoriteModels.has(model.id)}
            onToggleFavorite={toggleModelFavorite}
            onToggleEnabled={toggleModelEnabled}
          />
        ))}
      </CardContent>
    </Card>
  );
} 