"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CountryCode } from "@/domain/checkout/types/country";
import { getApiPath } from "@/lib/util/api";

interface UseShippingCostReturn {
  shippingCost: number;
  shippingWeight: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useShippingCost(
  country: CountryCode,
  orderWeight: number,
  requiresShippingAddress: boolean
): UseShippingCostReturn {
  const [shippingCost, setShippingCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Identifies the most recent request. A response only applies if its own id
   * is still the current one.
   *
   * Without this, a cart change that removes shipping races the request it
   * supersedes: the effect sets the cost to 0, then the earlier in-flight
   * response resolves and writes its now-wrong cost back, leaving a shipping
   * fee on a cart with nothing shippable in it. Pre-filled checkout links hit
   * this reliably, because they replace the cart milliseconds after mount
   * while the first request for the restored cart is still open.
   */
  const requestIdRef = useRef(0);

  const fetchShippingCost = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestIdRef.current === requestId;

    // Skip if no shipping needed
    if (!requiresShippingAddress || orderWeight <= 0) {
      setShippingCost(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiPath(`shipping/cost?country=${country}&weight=${orderWeight}`)
      );

      if (!response.ok) {
        throw new Error(`Shipping calculation failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!isCurrent()) return;
      setShippingCost(data.shippingCost.cost);
    } catch (err) {
      if (!isCurrent()) return;
      const errorMessage =
        err instanceof Error ? err.message : "Failed to calculate shipping";
      setError(errorMessage);
      setShippingCost(0);
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
      }
    }
  }, [country, orderWeight, requiresShippingAddress]);

  useEffect(() => {
    // No cleanup needed: every invocation (including the skip path) claims a
    // new id, so the next run retires any response still in flight for the
    // inputs being left behind.
    fetchShippingCost();
  }, [fetchShippingCost]);

  return {
    shippingCost,
    shippingWeight: orderWeight,
    isLoading,
    error,
    refetch: fetchShippingCost,
  };
}
