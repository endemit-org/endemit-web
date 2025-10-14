import { transformPriceToStripe } from "@/services/stripe/util";
import shippingService from "@/services/shipping";
import { Country } from "@/types/country";
import { ShippingAddress } from "@/types/checkout";

export const createShippingLineItem = (
  shippingAddress: ShippingAddress,
  orderWeight: number
) => {
  const shippingCalculation = shippingService.calculateShippingCost(
    shippingAddress.country as Country,
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
