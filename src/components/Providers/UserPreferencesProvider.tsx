"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useCachedUserPreferences } from '@/hooks/useCachedUserPreferences';

export type UserPreferences = ReturnType<typeof useCachedUserPreferences>;
const UserPreferencesContext = createContext<UserPreferences>({
  useOpenRouterForAll: false,
  disabledModels: [],
  favoriteModels: [],
  defaultModelId: null,
});

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const preferencesResult = useCachedUserPreferences();
  
  return (
    <UserPreferencesContext.Provider value={preferencesResult}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}
