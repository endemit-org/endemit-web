import { CountryCode } from "@/domain/checkout/types/country";
import { getCountry } from "@/domain/checkout/actions/getCountry";
import { getShippingForCountry } from "@/domain/checkout/actions/getShippingForCountry";

class ShippingService {
  calculateShippingCost(country: CountryCode, weightInGrams: number) {
    if (weightInGrams <= 0) {
      throw new Error("Weight must be greater than 0");
    }

    const countryData = getShippingForCountry(country);

    if (!countryData) {
      throw new Error(`Country ${country} not found in configuration`);
    }

    const weightRange = countryData.weightRanges.find(
      range => weightInGrams <= range.maxGrams
    );

    if (!weightRange) {
      throw new Error(
        `No shipping rate found for weight ${weightInGrams}g to ${country}`
      );
    }

    return {
      cost: weightRange.cost,
      country: getCountry(country),
      weightClass: weightRange.maxGrams,
    };
  }

  getCountryDetails(country: CountryCode) {
    return getShippingForCountry(country);
  }
}

export const shippingService = new ShippingService();
export default shippingService;
