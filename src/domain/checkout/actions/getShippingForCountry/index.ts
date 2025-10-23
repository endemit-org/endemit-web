import { countries } from "@/domain/checkout/config/countries.config";
import { CountryCode } from "@/domain/checkout/types/country";
import { shippingForCountries } from "@/domain/checkout/config/shippingForCountries.config";

export const getShippingForCountry = (countryCode: CountryCode) => {
  const country = countries[countryCode];
  return { ...country, weightRanges: shippingForCountries[countryCode] };
};
