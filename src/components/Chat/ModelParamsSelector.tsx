"use client";

import { useState } from "react";
import { Settings, AlertTriangle } from "lucide-react";
import { useChatConfig } from "./context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModelParams } from "@convex/schema";

type ParameterConfig = {
  key: keyof ModelParams;
  label: string;
  type: 'number' | 'integer';
  min?: number;
  max?: number;
  step?: number;
  description: string;
};

const PARAMETER_CONFIGS: ParameterConfig[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.1,
    description: 'Controls randomness (0 = deterministic, 1 = very creative)'
  },
  {
    key: 'topP',
    label: 'Top P',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.1,
    description: 'Nucleus sampling (0.1 = focused, 1.0 = diverse)'
  },
  {
    key: 'topK',
    label: 'Top K',
    type: 'integer',
    min: 1,
    description: 'Only sample from top K options (advanced use case)'
  },
  {
    key: 'maxTokens',
    label: 'Max Tokens',
    type: 'integer',
    min: 1,
    description: 'Maximum number of tokens to generate'
  },
  {
    key: 'presencePenalty',
    label: 'Presence Penalty',
    type: 'number',
    min: -1,
    max: 1,
    step: 0.1,
    description: 'Penalize repeating information already in prompt (-1 to 1, 0 = no penalty)'
  },
  {
    key: 'frequencyPenalty',
    label: 'Frequency Penalty',
    type: 'number',
    min: -1,
    max: 1,
    step: 0.1,
    description: 'Penalize repeatedly using the same words/phrases (-1 to 1, 0 = no penalty)'
  },
  {
    key: 'seed',
    label: 'Seed',
    type: 'integer',
    description: 'Integer for deterministic results (if supported)'
  }
];

const applyBounds = (value: number, min?: number, max?: number): number => {
  let bounded = value;
  if (min !== undefined) bounded = Math.max(bounded, min);
  if (max !== undefined) bounded = Math.min(bounded, max);
  return bounded;
};

const ParameterField = ({ config }: { config: ParameterConfig }) => {
  const { modelParams, updateParam } = useChatConfig();

  const value = modelParams[config.key];
  const inputValue = value !== undefined ? String(value) : '';

  // Check if both temperature and topP are set for warning
  const hasBothTempAndTopP = modelParams.temperature !== undefined && modelParams.topP !== undefined;
  const isConflictingParam = (config.key === 'temperature' || config.key === 'topP') && hasBothTempAndTopP;

  const handleChange = (inputValue: string) => {
    if (!inputValue.trim()) {
      updateParam(config.key, undefined);
      return;
    }

    const numValue = config.type === 'integer' 
      ? parseInt(inputValue) 
      : parseFloat(inputValue);
    
    if (!isNaN(numValue)) {
      const boundedValue = applyBounds(numValue, config.min, config.max);
      updateParam(config.key, boundedValue as ModelParams[typeof config.key]);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={config.key} className={isConflictingParam ? "text-amber-600" : ""}>
        {config.label}
        {isConflictingParam && <AlertTriangle className="inline h-3 w-3 ml-1" />}
      </Label>
      <Input
        id={config.key}
        type="number"
        min={config.min}
        max={config.max}
        step={config.step}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Default"
        className={isConflictingParam ? "border-amber-300 focus:border-amber-500" : ""}
      />
      <p className="text-xs text-muted-foreground">
        {config.description}
      </p>
    </div>
  );
};

export default function ModelParamsSelector() {
  const { modelParams, updateParam, resetParams } = useChatConfig();
  const [open, setOpen] = useState(false);

  const hasBothTempAndTopP = modelParams.temperature !== undefined && modelParams.topP !== undefined;
  const clearTemperature = () => updateParam('temperature', undefined);
  const clearTopP = () => updateParam('topP', undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4" />
          {hasBothTempAndTopP && <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Model Parameters</h4>
            <Button variant="ghost" size="sm" onClick={resetParams}>
              Reset
            </Button>
          </div>

          {hasBothTempAndTopP && (
            <Alert className="border-amber-200 bg-amber-600/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <p>Both Temperature and Top P are set. It&apos;s recommended to use only one.</p>
                <div className="flex flex-col gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={clearTemperature}>
                    Clear Temperature
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearTopP}>
                    Clear Top P
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {PARAMETER_CONFIGS.map((config) => (
            <ParameterField key={config.key} config={config} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 