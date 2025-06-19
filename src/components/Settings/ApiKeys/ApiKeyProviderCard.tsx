"use client";

import { memo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, Trash2, Plus, Check, Edit, Loader2, X, Info } from "lucide-react";
import { ProviderIcon, ModelProperty} from "@/components/Chat/shared";
import {
  ProviderKey,
  type Model,
  type ProviderDefinition,
  getModelCapabilities,
} from "@/lib/models";
import { Doc, type Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

type ApiKey = Doc<"apiKeys"> & { hasKey: boolean };
interface ApiKeyProviderCardProps {
  providerId: string;
  provider: ProviderDefinition;
  models: Model[];
  existingKey: ApiKey | undefined;
  isLoading: boolean;
  onSave: (provider: string, keyName: string, apiKey: string) => Promise<void>;
  onToggle: (keyId: Id<"apiKeys">) => Promise<void>;
  onDelete: (keyId: Id<"apiKeys">) => Promise<void>;
}

const StatusBadge = memo(function StatusBadge({ 
  existingKey, 
  isLoading 
}: { 
  existingKey: ApiKey | undefined; 
  isLoading: boolean; 
}) {
  if (isLoading) {
    return (
      <Badge style="outline" color="info" className="text-xs font-medium">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (existingKey?.hasKey) {
    return (
      <Badge
        style="soft"
        color={existingKey.isEnabled ? "success" : "warning"}
        className="text-xs font-medium"
      >
        {existingKey.isEnabled ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
        {existingKey.isEnabled ? "Active" : "Disabled"}
      </Badge>
    );
  }

  return (
    <Badge 
      style="outline" 
      color="info"
      className="text-xs font-medium"
    >
      <Key className="h-3 w-3 mr-1" />
      No Key
    </Badge>
  );
});

const ProviderCardHeader = memo(function ProviderCardHeader({
  providerId,
  provider,
  models,
  existingKey,
  isLoading,
}: {
  providerId: string;
  provider: ProviderDefinition;
  models: Model[];
  existingKey: ApiKey | undefined;
  isLoading: boolean;
}) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ProviderIcon provider={providerId as ProviderKey} size="lg" />
          <div>
            <CardTitle className="text-lg">{provider.name}</CardTitle>
            <CardDescription>
              {models.length} model{models.length !== 1 ? "s" : ""} •{" "}
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {provider.website}
              </a>
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge existingKey={existingKey} isLoading={isLoading} />
        </div>
      </div>
    </CardHeader>
  );
});

const ModelItem = memo(function ModelItem({ model }: { model: Model }) {
  const capabilities = getModelCapabilities(model);
  
  return (
    <div className="flex items-center space-x-2 p-2.5 bg-background/60 rounded-md border border-border/40 hover:bg-background/80 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {model.name}
        </p>
        {model.subtitle && (
          <p className="text-xs text-muted-foreground truncate">
            {model.subtitle}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        {capabilities.map((capability) => (
          <ModelProperty 
            key={capability.id} 
            property={capability} 
            iconOnly={true} 
          />
        ))}
      </div>
    </div>
  );
});

const AffectedModelsSection = memo(function AffectedModelsSection({
  models,
}: {
  models: Model[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">
          Affected Models
        </Label>
        <Badge 
          style="outline" 
          color="default"
          className="text-xs font-normal px-2 py-1"
        >
          {models.length} {models.length === 1 ? "model" : "models"}
        </Badge>
      </div>
      
      <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-border/50">
        {models.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {models.map((model) => (
                <ModelItem key={model.id} model={model} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No models are currently configured for this provider.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

const ApiKeyForm = memo(function ApiKeyForm({
  providerId,
  provider,
  newKeyName,
  setNewKeyName,
  newKeyInput,
  setNewKeyInput,
  isSaving,
  onSave,
  onCancel,
  onKeyDown,
}: {
  providerId: string;
  provider: ProviderDefinition;
  newKeyName: string;
  setNewKeyName: (value: string) => void;
  newKeyInput: string;
  setNewKeyInput: (value: string) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="space-y-1">
        <Label htmlFor={`keyName-${providerId}`} className="text-xs">
          Key Name
        </Label>
        <Input
          id={`keyName-${providerId}`}
          placeholder={`${provider.name} API Key`}
          value={newKeyName}
          autoComplete="one-time-code"
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`keyInput-${providerId}`} className="text-xs">
          API Key
        </Label>
        <Input
          id={`keyInput-${providerId}`}
          type="password"
          placeholder="sk-..."
          autoComplete="one-time-code"
          value={newKeyInput}
          onChange={(e) => setNewKeyInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={onSave}
          disabled={isSaving || !newKeyInput.trim()}
        >
          {isSaving ? "Saving..." : "Save Key"}
        </Button>
      </div>
    </div>
  );
});

const ExistingKeyManagement = memo(function ExistingKeyManagement({
  providerId,
  existingKey,
  onToggle,
  onDelete,
  onEdit,
}: {
  providerId: string;
  existingKey: ApiKey;
  onToggle: (keyId: Id<"apiKeys">) => Promise<void>;
  onDelete: (keyId: Id<"apiKeys">) => Promise<void>;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">API Key</Label>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label
              htmlFor={`toggle-${providerId}`}
              className="text-sm cursor-pointer"
            >
              {existingKey.isEnabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id={`toggle-${providerId}`}
              checked={existingKey.isEnabled}
              onCheckedChange={() => onToggle(existingKey._id!)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={onEdit} tooltip="Edit key">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(existingKey._id!)}
            tooltip="Delete key"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium">{existingKey.keyName}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated:{" "}
          {new Date(existingKey.updatedAt!).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
});

const AddKeyPrompt = memo(function AddKeyPrompt({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <p className="text-sm text-muted-foreground">
        No API key has been added for this provider.
      </p>
      <Button variant="secondary" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add Key
      </Button>
    </div>
  );
});

export const ApiKeyProviderCard = memo(function ApiKeyProviderCard({
  providerId,
  provider,
  models,
  existingKey,
  isLoading,
  onSave,
  onToggle,
  onDelete,
}: ApiKeyProviderCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setIsEditing(true);
    setNewKeyName(existingKey?.keyName || "");
    setNewKeyInput(""); // Don't pre-fill for security
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setNewKeyInput("");
    setNewKeyName("");
  };

  const handleSave = async () => {
    if (!newKeyInput.trim()) return;
    
    setIsSaving(true);
    try {
      const keyName = newKeyName.trim() || `${provider.name} API Key`;
      await onSave(providerId, keyName, newKeyInput.trim());
      cancelEditing();
    } catch (error) {
      console.error('Error saving API key:', error);
      // TODO: Add toast notification here
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const renderKeySection = () => {
    if (isLoading) {
      return <Skeleton className="h-20" />;
    }

    if (existingKey?.hasKey && !isEditing) {
      return (
        <ExistingKeyManagement
          providerId={providerId}
          existingKey={existingKey}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={startEditing}
        />
      );
    }

    if (isEditing) {
      return (
        <ApiKeyForm
          providerId={providerId}
          provider={provider}
          newKeyName={newKeyName}
          setNewKeyName={setNewKeyName}
          newKeyInput={newKeyInput}
          setNewKeyInput={setNewKeyInput}
          isSaving={isSaving}
          onSave={handleSave}
          onCancel={cancelEditing}
          onKeyDown={handleKeyDown}
        />
      );
    }

    return <AddKeyPrompt onAdd={startEditing} />;
  };

  return (
    <Card>
      <ProviderCardHeader
        providerId={providerId}
        provider={provider}
        models={models}
        existingKey={existingKey}
        isLoading={isLoading}
      />

      <CardContent className="space-y-4">
        <AffectedModelsSection models={models} />
        {renderKeySection()}
      </CardContent>
    </Card>
  );
});

ApiKeyProviderCard.displayName = "ApiKeyProviderCard"; 