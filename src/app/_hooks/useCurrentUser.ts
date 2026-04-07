"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  name: string | null;
  email: string | null;
  roles: string[];
}

interface UseCurrentUserResult {
  user: User | null;
  isLoading: boolean;
}

// Custom event name for auth state changes
export const AUTH_STATE_CHANGED_EVENT = "auth-state-changed";

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser({
          name: data.user.name,
          email: data.user.email,
          roles: data.user.roles,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchUser();

    // Check on tab focus (detects login in another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchUser();
      }
    };

    // Listen for auth state changes (e.g., after checkout auto-login)
    const handleAuthStateChanged = () => {
      void fetchUser();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
    };
  }, [fetchUser]);

  return { user, isLoading };
}

// Helper to trigger auth state refresh across components
export function notifyAuthStateChanged() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}
