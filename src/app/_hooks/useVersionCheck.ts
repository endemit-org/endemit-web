"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const INITIAL_DELAY_MS = 10_000; // 10 seconds after mount
const BUNDLED_DEPLOYMENT_ID =
  process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || "";

/**
 * Hook that periodically checks for new app deployments and auto-refreshes.
 *
 * Checks occur:
 * - 10 seconds after mount (initial check)
 * - Every 5 minutes thereafter
 * - When tab becomes visible again
 *
 * Refresh only happens when ALL conditions are met:
 * - Bundled deployment ID exists (not local dev)
 * - API response is 200 OK
 * - Response is valid JSON with deploymentId field
 * - Server deploymentId is non-empty string
 * - Server deploymentId differs from bundled ID
 *
 * @example
 * // In a client component mounted on all pages
 * function VersionChecker() {
 *   useVersionCheck();
 *   return null;
 * }
 */
export function useVersionCheck() {
  const isChecking = useRef(false);

  useEffect(() => {
    // Skip if no bundled deployment ID (local development)
    if (!BUNDLED_DEPLOYMENT_ID) return;

    const checkVersion = async () => {
      if (isChecking.current) return;
      isChecking.current = true;

      try {
        const res = await fetch("/api/v1/version", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        // Only proceed if we got a successful response
        if (!res.ok) return;

        const data = await res.json();

        // STRICT CONDITIONS FOR REFRESH:
        // 1. Response must be valid JSON with deploymentId field
        // 2. Server deploymentId must be a non-empty string
        // 3. Server deploymentId must differ from bundled ID
        if (
          typeof data?.deploymentId === "string" &&
          data.deploymentId &&
          data.deploymentId !== BUNDLED_DEPLOYMENT_ID
        ) {
          window.location.reload();
        }
      } catch {
        // Network/parse error - silently ignore, try again next interval
      } finally {
        isChecking.current = false;
      }
    };

    // Initial check after mount
    const initialTimeout = setTimeout(checkVersion, INITIAL_DELAY_MS);

    // Periodic checks
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);

    // Also check on tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
