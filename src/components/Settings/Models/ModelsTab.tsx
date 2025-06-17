"use client";

import { useModelManagerContext } from "@/components/Providers/ModelManagerProvider";
import { ModelGlobalSettings } from "./ModelGlobalSettings";
import { ModelProviderGroup } from "./ModelProviderGroup";
import { ModelLoadingState } from "./ModelLoadingState";

export function ModelsTab() {
  const { userPreferences, modelsByProvider } =
    useModelManagerContext();

  if (userPreferences === undefined) {
    return <ModelLoadingState />;
  }

  return (
    <div className="space-y-6">
      <ModelGlobalSettings />

      {Object.entries(modelsByProvider).map(([providerId, models]) => (
        <ModelProviderGroup
          key={providerId}
          providerId={providerId}
          models={models}
        />
      ))}
    </div>
  );
} 