"use client";

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { type FunctionReturnType } from "convex/server";

type UserPreferencesQueryResult = FunctionReturnType<typeof api.userPreferences.getUserPreferences>;

export const USER_PREFERENCES_CACHE_KEY = 'cached_user_preferences';

const defaultPreferences: UserPreferencesQueryResult = {
  useOpenRouterForAll: false,
  disabledModels: [],
  favoriteModels: [],
  defaultModelId: undefined,
  theme: "system",
  showHeader: false,
};

export const getCachedUserPreferences = (): UserPreferencesQueryResult => {
  if (typeof window === 'undefined') return defaultPreferences;
  try {
    const cached = localStorage.getItem(USER_PREFERENCES_CACHE_KEY);
    return cached ? JSON.parse(cached) : defaultPreferences;
  } catch (error) {
    console.error('Error reading cached user preferences:', error);
    return defaultPreferences;
  }
};

const setCachedUserPreferences = (preferences: UserPreferencesQueryResult) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PREFERENCES_CACHE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error caching user preferences:', error);
  }
};

export function useCachedUserPreferences() {
  const serverPreferences = useQuery(api.userPreferences.getUserPreferences);

  useEffect(() => {
    if (serverPreferences) {
      setCachedUserPreferences(serverPreferences);
    }
  }, [serverPreferences]);

  useEffect(() => {
    if (serverPreferences === null) {
      try {
        localStorage.removeItem(USER_PREFERENCES_CACHE_KEY);
      } catch (error) {
        console.error('Failed to clear user preferences cache:', error);
      }
    }
  }, [serverPreferences]);

  return serverPreferences === undefined ? getCachedUserPreferences() : serverPreferences;
} 