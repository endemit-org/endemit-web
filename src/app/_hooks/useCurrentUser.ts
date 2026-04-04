"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface User {
  name: string | null;
  email: string | null;
  roles: string[];
}

interface UseCurrentUserResult {
  user: User | null;
  isLoading: boolean;
}

const POLL_INTERVAL_MS = 3000;

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/auth/me");
      if (response.ok) {
        const data = await response.json();
        const userData = {
          name: data.user.name,
          email: data.user.email,
          roles: data.user.roles,
        };
        setUser(userData);
        userRef.current = userData;
        // Stop polling once signed in
        stopPolling();
      } else {
        setUser(null);
        userRef.current = null;
      }
    } catch {
      setUser(null);
      userRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [stopPolling]);

  useEffect(() => {
    // Initial fetch
    fetchUser();

    // Poll every 3 seconds while not signed in
    intervalRef.current = setInterval(() => {
      if (!userRef.current) {
        fetchUser();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [fetchUser, stopPolling]);

  return { user, isLoading };
}
