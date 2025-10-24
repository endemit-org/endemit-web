import { countries } from "@/domain/checkout/config/countries.config";
import { CountryCode } from "@/domain/checkout/types/country";

export const getCountry = (countryCode: CountryCode) => {
  return countries[countryCode];
};
