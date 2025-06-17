"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

export type UserPreferences = ReturnType<typeof useQuery<typeof api.userPreferences.getUserPreferences>>;
const UserPreferencesContext = createContext<UserPreferences>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const preferencesResult = useQuery(api.userPreferences.getUserPreferences);
  
  return (
    <UserPreferencesContext.Provider value={preferencesResult}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  return context ?? {} as UserPreferences;
}
