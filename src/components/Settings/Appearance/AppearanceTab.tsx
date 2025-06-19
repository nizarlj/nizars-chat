"use client";

import { useTheme } from "next-themes";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserPreferences } from "@/components/Providers/UserPreferencesProvider";
import { Moon, Sun, Monitor, Layout } from "lucide-react";

type Theme = "light" | "dark" | "system";

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const userPreferences = useUserPreferences();
  
  const updatePreferences = useMutation(api.userPreferences.updateUserPreferences).withOptimisticUpdate(
    (localStore, args) => {
      const currentPreferences = localStore.getQuery(api.userPreferences.getUserPreferences, {});
      if (currentPreferences) {
          localStore.setQuery(api.userPreferences.getUserPreferences, {}, {
            ...currentPreferences,
            defaultModelId: currentPreferences.defaultModelId ?? undefined,
            ...args
          });
      }
    }
  );

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updatePreferences({ theme: newTheme });
  };

  const handleHeaderToggle = (showHeader: boolean) => {
    updatePreferences({ showHeader });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Theme Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Theme</h3>
            <p className="text-sm text-muted-foreground">
              Select the theme for the application.
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => handleThemeChange("light")}
                className="flex items-center space-x-2"
              >
                <Sun className="h-5 w-5" />
                <span>Light</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => handleThemeChange("dark")}
                className="flex items-center space-x-2"
              >
                <Moon className="h-5 w-5" />
                <span>Dark</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => handleThemeChange("system")}
                className="flex items-center space-x-2"
              >
                <Monitor className="h-5 w-5" />
                <span>System</span>
              </Button>
            </div>
          </div>

          {/* Header Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Layout</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Layout className="h-4 w-4" />
                  <Label htmlFor="show-header" className="text-base">
                    Show Header
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Display a header bar with conversation title, model info, and status.
                </p>
              </div>
              <Switch
                id="show-header"
                checked={userPreferences?.showHeader || false}
                onCheckedChange={handleHeaderToggle}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 