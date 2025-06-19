"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import ConvexProvider from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";
import { UserPreferencesProvider, useUserPreferences } from "./UserPreferencesProvider";
import { Toaster } from "../ui/sonner";
import { TooltipProvider } from "../ui/tooltip";
import { useTheme } from "next-themes";
import { useEffect } from "react";

function ThemeSetter() {
  const { theme: storedTheme } = useUserPreferences();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, [storedTheme, setTheme]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <TooltipProvider>
            <SidebarProvider>
              <UserPreferencesProvider>
                  <ThemeSetter />
                  {children}
              </UserPreferencesProvider>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
    </ConvexProvider>
  );
}