"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROVIDER_DEFINITIONS, getModelsByProvider } from "@/lib/models";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { ApiKeyProviderCard } from "./ApiKeyProviderCard";
import { Key } from "lucide-react";

type ApiKey = Doc<"apiKeys"> & { hasKey: boolean };

export function ApiKeysTab() {
  const apiKeys = useQuery(api.apiKeysData.getUserApiKeys);
  const upsertApiKey = useAction(api.apiKeys.upsertApiKey);
  const toggleApiKey = useMutation(api.apiKeysData.toggleApiKey).withOptimisticUpdate(
    (localStore, { keyId }) => {
      const currentKeys = localStore.getQuery(api.apiKeysData.getUserApiKeys, {});
      if (currentKeys) {
        const newKeys = currentKeys.map(key =>
          key._id === keyId ? { ...key, isEnabled: !key.isEnabled } : key
        );
        localStore.setQuery(api.apiKeysData.getUserApiKeys, {}, newKeys);
      }
    }
  );
  const deleteApiKey = useMutation(api.apiKeysData.deleteApiKey);

  const apiKeysByProvider = (apiKeys || []).reduce((acc, key) => {
    acc[key.provider!] = key as unknown as ApiKey;
    return acc;
  }, {} as Record<string, ApiKey>);

  const handleSaveApiKey = async (provider: string, keyName: string, apiKey: string) => {
    if (!apiKey.trim()) return;

    try {
      await upsertApiKey({
        provider,
        keyName: keyName,
        apiKey: apiKey,
        isEnabled: true,
      });

    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleToggleApiKey = async (keyId: Id<"apiKeys">) => {
    try {
      await toggleApiKey({ keyId });
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const handleDeleteApiKey = async (keyId: Id<"apiKeys">) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      try {
        await deleteApiKey({ keyId });
      } catch (error) {
        console.error('Error deleting API key:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">API Keys</CardTitle>
          </div>
          <CardDescription>
            <p>Manage your API keys for all providers.</p>
            <p>When you add an API key for a provider, we&apos;ll use it for all models from that provider.</p>
          </CardDescription>
        </CardHeader>
      </Card>

      {PROVIDER_DEFINITIONS.map((providerDef) => {
        const existingKey = apiKeysByProvider[providerDef.id];
        const models = getModelsByProvider(providerDef.id);

        return (
          <ApiKeyProviderCard
            key={providerDef.id}
            providerId={providerDef.id}
            provider={providerDef}
            models={models}
            existingKey={existingKey}
            isLoading={apiKeys === undefined}
            onSave={handleSaveApiKey}
            onToggle={handleToggleApiKey}
            onDelete={handleDeleteApiKey}
          />
        );
      })}
    </div>
  );
} 