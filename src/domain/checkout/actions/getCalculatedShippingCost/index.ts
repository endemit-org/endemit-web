import { ShippingAddress } from "@/domain/checkout/types/checkout";
import { CartItem } from "@/domain/checkout/types/cartItem";
import { includesShippableProduct } from "@/domain/checkout/businessRules";
import shippingService from "@/lib/services/shipping";
import { CountryCode } from "@/domain/checkout/types/country";

export const getCalculatedShippingCost = (
  shouldHaveShippingAddress: boolean,
  shippingAddress: ShippingAddress | undefined,
  checkoutItems: CartItem[],
  orderWeight: number
): number => {
  if (!shouldHaveShippingAddress) return 0;
  if (!shippingAddress) return 0;
  if (!includesShippableProduct(checkoutItems)) return 0;

  return shippingService.calculateShippingCost(
    shippingAddress.country as CountryCode,
    orderWeight
  ).cost;
};
