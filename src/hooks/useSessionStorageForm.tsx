"use client";

import { useCallback } from "react";
import { transformHoursToMs } from "../../lib/util";

const STORAGE_KEY = "checkout_form_data";

interface StorageData<T> {
  data: T;
  timestamp: number;
}

interface UseSessionStorageFormReturn<T> {
  saveToStorage: (data: T) => void;
  loadFromStorage: () => T | null;
  clearStorage: () => void;
}

export function useSessionStorageForm<T>(
  storageKey: string = STORAGE_KEY,
  expirationMs: number = transformHoursToMs(24)
): UseSessionStorageFormReturn<T> {
  const saveToStorage = useCallback(
    (data: T) => {
      if (typeof window === "undefined") return;

      try {
        const storageData: StorageData<T> = {
          data,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(storageKey, JSON.stringify(storageData));
      } catch (error) {
        console.error("Error saving to sessionStorage:", error);
      }
    },
    [storageKey]
  );

  const loadFromStorage = useCallback((): T | null => {
    if (typeof window === "undefined") return null;

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return null;

      const storageData: StorageData<T> = JSON.parse(stored);
      const isExpired = Date.now() - storageData.timestamp > expirationMs;

      if (isExpired) {
        sessionStorage.removeItem(storageKey);
        return null;
      }

      return storageData.data;
    } catch (error) {
      console.error("Error loading from sessionStorage:", error);
      return null;
    }
  }, [storageKey, expirationMs]);

  const clearStorage = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
    }
  }, [storageKey]);

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage,
  };
}
