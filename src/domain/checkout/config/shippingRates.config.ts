import { WeightRange } from "@/domain/checkout/types/shipping";

export const DOMESTIC_SHIPPING: WeightRange[] = [
  { maxGrams: 500, cost: 5 },
  { maxGrams: 1000, cost: 7 },
  { maxGrams: 2000, cost: 10 },
  { maxGrams: 4000, cost: 15 },
  { maxGrams: 10000, cost: 20 },
  { maxGrams: Infinity, cost: 25 },
];
export const EU_SHIPPING: WeightRange[] = [
  { maxGrams: 500, cost: 10 },
  { maxGrams: 1000, cost: 12 },
  { maxGrams: 2000, cost: 15 },
  { maxGrams: 4000, cost: 20 },
  { maxGrams: 10000, cost: 25 },
  { maxGrams: Infinity, cost: 30 },
];
export const LONG_SHIPPING: WeightRange[] = [
  { maxGrams: 500, cost: 15 },
  { maxGrams: 1000, cost: 20 },
  { maxGrams: 2000, cost: 25 },
  { maxGrams: 4000, cost: 30 },
  { maxGrams: 10000, cost: 40 },
  { maxGrams: Infinity, cost: 60 },
];
