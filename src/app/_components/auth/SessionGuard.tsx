"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SessionGuardProps {
  hasUser: boolean;
}

export default function SessionGuard({ hasUser }: SessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check if we think we have a user
    if (!hasUser) return;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/v1/auth/session");

        if (response.status === 401) {
          // Session is invalid - reload to get fresh server state
          // This will clear any cached user data and show signed-out state
          window.location.reload();
        }
      } catch {
        // Network error - don't do anything, might be offline
      }
    };

    checkSession();
  }, [hasUser, pathname]);

  return null;
}
