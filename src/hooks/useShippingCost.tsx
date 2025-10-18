"use client";

import { useState, useEffect, useCallback } from "react";
import { Country } from "@/types/country";
import { getApiPath } from "../../lib/api";

interface UseShippingCostReturn {
  shippingCost: number;
  shippingWeight: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useShippingCost(
  country: Country,
  orderWeight: number,
  requiresShippingAddress: boolean
): UseShippingCostReturn {
  const [shippingCost, setShippingCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShippingCost = useCallback(async () => {
    // Skip if no shipping needed
    if (!requiresShippingAddress || orderWeight <= 0) {
      setShippingCost(0);
      setError(null);
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
      setShippingCost(data.shippingCost.cost);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to calculate shipping";
      setError(errorMessage);
      setShippingCost(0);
    } finally {
      setIsLoading(false);
    }
  }, [country, orderWeight, requiresShippingAddress]);

  useEffect(() => {
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
