import { transformPriceToStripe } from "@/domain/checkout/transformers/transformPriceToStripe";
import shippingService from "@/lib/services/shipping";
import { CountryCode } from "@/domain/checkout/types/country";
import { ShippingAddress } from "@/domain/checkout/types/checkout";

export const transformToShippingLineItem = (
  shippingAddress: ShippingAddress,
  orderWeight: number
) => {
  const shippingCalculation = shippingService.calculateShippingCost(
    shippingAddress.country as CountryCode,
    orderWeight
  );

  return {
    price_data: {
      currency: "eur",
      product_data: {
        name: `Shipping to ${shippingCalculation.country.name}`,
        description: `Shipping to ${shippingAddress.name}, ${shippingAddress.postalCode} ${shippingAddress.city}, ${shippingCalculation.country.name}`,
        images: [
          "https://images.prismic.io/endemit/aOk-rp5xUNkB11YE_delivery.png?auto=format,compress",
        ],
      },
      unit_amount: transformPriceToStripe(shippingCalculation.cost),
    },
    quantity: 1,
  };
};
