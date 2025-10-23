import { ShippingAddress } from "@/domain/checkout/types/checkout";
import { getCountry } from "@/domain/checkout/actions/getCountry";

export const transformToNormalizedShippingAddress = (
  shouldHaveShippingAddress: boolean,
  shippingAddress: ShippingAddress | undefined
) => {
  if (!shouldHaveShippingAddress || !shippingAddress) return;

  const countryDetails = getCountry(shippingAddress.country);
  shippingAddress.phone = `${countryDetails.callingCode}${shippingAddress.phone}`;
};
