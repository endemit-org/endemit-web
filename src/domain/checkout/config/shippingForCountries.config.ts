import { CountryCode } from "@/domain/checkout/types/country";
import {
  DOMESTIC_SHIPPING,
  EU_SHIPPING,
  LONG_SHIPPING,
} from "@/domain/checkout/config/shippingRates.config";
import { WeightRange } from "@/domain/checkout/types/shipping";

export const shippingForCountries: Record<CountryCode, WeightRange[]> = {
  SI: DOMESTIC_SHIPPING,

  FR: EU_SHIPPING,
  DE: EU_SHIPPING,
  NL: EU_SHIPPING,
  AT: EU_SHIPPING,
  BE: EU_SHIPPING,
  LU: EU_SHIPPING,
  CZ: EU_SHIPPING,
  HU: EU_SHIPPING,
  IE: EU_SHIPPING,
  IT: EU_SHIPPING,
  PL: EU_SHIPPING,
  SK: EU_SHIPPING,
  ES: EU_SHIPPING,
  BG: EU_SHIPPING,
  HR: EU_SHIPPING,
  DK: EU_SHIPPING,
  RO: EU_SHIPPING,
  EE: EU_SHIPPING,
  GR: EU_SHIPPING,
  LV: EU_SHIPPING,
  LT: EU_SHIPPING,
  PT: EU_SHIPPING,
  SE: EU_SHIPPING,
  FI: EU_SHIPPING,
  RS: EU_SHIPPING,
  BA: EU_SHIPPING,
  ME: EU_SHIPPING,
  MK: EU_SHIPPING,
  CY: EU_SHIPPING,
  MT: EU_SHIPPING,

  UK: LONG_SHIPPING,
  US: LONG_SHIPPING,
  CA: LONG_SHIPPING,
  AU: LONG_SHIPPING,
  JP: LONG_SHIPPING,
};
