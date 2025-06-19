"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { FOLDERS_CACHE_KEY } from "./useFolders";
import { THREADS_CACHE_KEY } from "./useThreads";
import { USER_PREFERENCES_CACHE_KEY } from "./useCachedUserPreferences";

interface CachedUserData {
  name?: string;
  email?: string;
}

const USER_CACHE_KEY = "cached_user";

function getCachedUser() {
  const cached = localStorage.getItem(USER_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

function setCachedUser(userData: CachedUserData) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
}

export function useCachedUser() {
  const convexUser = useQuery(api.auth.getCurrentUser);

  useEffect(() => {
    if (convexUser) {
      const userData = {
        name: convexUser.name,
        email: convexUser.email,
      };
      
      try {
        setCachedUser(userData);
      } catch (error) {
        console.error("Failed to cache user data:", error);
      }
    }
  }, [convexUser]);

  useEffect(() => {
    if (convexUser === null) {
      try {
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(THREADS_CACHE_KEY);
        localStorage.removeItem(FOLDERS_CACHE_KEY);
        localStorage.removeItem(USER_PREFERENCES_CACHE_KEY);
      } catch (error) {
        console.error("Failed to clear user cache:", error);
      }
    }
  }, [convexUser]);

  return convexUser === undefined ? getCachedUser() : convexUser;
} 