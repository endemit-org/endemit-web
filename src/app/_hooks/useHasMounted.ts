"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the component has mounted on the client.
 * Useful for avoiding hydration mismatches when rendering content
 * that differs between server and client (e.g., dates, locale-specific formatting).
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
