"use client";

import { useTheme } from "next-themes";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const updateTheme = useMutation(api.userPreferences.updateUserPreferences).withOptimisticUpdate(
    (localStore, { theme }) => {
      const currentPreferences = localStore.getQuery(api.userPreferences.getUserPreferences, {});
      if (currentPreferences && theme) {
          localStore.setQuery(api.userPreferences.getUserPreferences, {}, {
            ...currentPreferences,
            defaultModelId: currentPreferences.defaultModelId ?? undefined,
            theme: theme
          });
      }
    }
  );

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updateTheme({ theme: newTheme });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
} 