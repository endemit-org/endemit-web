import { countries } from "@/domain/checkout/config/countries.config";
import { CountryCode } from "@/domain/checkout/types/country";
import { shippingForCountries } from "@/domain/checkout/config/shippingForCountries.config";

export const getShippingForCountries = () =>
  Object.fromEntries(
    Object.entries(countries).map(([code, country]) => [
      code,
      { ...country, weightRanges: shippingForCountries[code as CountryCode] },
    ])
  );
