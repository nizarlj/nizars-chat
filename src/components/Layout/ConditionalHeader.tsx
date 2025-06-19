"use client";

import { useUserPreferences } from "@/components/Providers/UserPreferencesProvider";
import { Header } from "@/components/Header";

export function ConditionalHeader() {
  const userPreferences = useUserPreferences();
  
  if (!userPreferences?.showHeader) {
    return null;
  }
  
  return <Header />;
} 