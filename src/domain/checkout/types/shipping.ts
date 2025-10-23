import { Country } from "@/domain/checkout/types/country";

export type WeightRange = {
  maxGrams: number;
  cost: number;
};

export type CountryWithShipping = Country & {
  weightRanges: WeightRange[];
};
