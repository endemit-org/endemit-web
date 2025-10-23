import { CountryCode } from "@/domain/checkout/types/country";
import { getCountry } from "@/domain/checkout/actions/getCountry";

export const getRegionFromCountry = (country: CountryCode) => {
  const countryData = getCountry(country);

  if (countryData) {
    return countryData.region;
  } else {
    return null;
  }
};
