import countryConfig from "@/domain/checkout/config/countries.config";
import { Country } from "@/types/country";

export const getCountry = (countryCode: Country) => {
  return countryConfig[countryCode];
};
