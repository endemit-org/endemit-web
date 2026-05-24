"use client";

import { useState, useEffect, useCallback } from "react";

interface OnlineStatus {
  isOnline: boolean;
  isOffline: boolean;
}

/**
 * Hook to track online/offline status with debouncing to avoid flicker
 * on brief network interruptions.
 *
 * @param debounceMs - Delay before confirming offline status (default: 1000ms)
 * @returns { isOnline, isOffline }
 *
 * @example
 * const { isOffline } = useOnlineStatus();
 * if (isOffline) {
 *   return <OfflineBanner />;
 * }
 */
export function useOnlineStatus(debounceMs = 1000): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() => {
    // SSR fallback - assume online
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  const [confirmedOffline, setConfirmedOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setConfirmedOffline(false);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  // Debounce offline confirmation to avoid flicker
  useEffect(() => {
    if (isOnline) {
      setConfirmedOffline(false);
      return;
    }

    const timer = setTimeout(() => {
      setConfirmedOffline(true);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [isOnline, debounceMs]);

  useEffect(() => {
    // Set initial state on mount
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline: isOnline || !confirmedOffline,
    isOffline: confirmedOffline,
  };
}
