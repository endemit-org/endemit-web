"use client";

import { useState, useEffect } from "react";

interface User {
  name: string | null;
  email: string | null;
  roles: string[];
}

interface UseCurrentUserResult {
  user: User | null;
  isLoading: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
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
    };

    fetchUser();
  }, []);

  return { user, isLoading };
}
