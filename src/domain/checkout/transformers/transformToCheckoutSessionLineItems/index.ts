import {
  ComplementaryTicketField,
  CustomStripeLineItem,
  ShippingAddress,
} from "@/domain/checkout/types/checkout";

import { shouldAddShippingToCheckout } from "@/domain/checkout/businessRules";
import { createProductLineItems } from "@/domain/checkout/transformers/transformToProductLineItems";
import { transformToShippingLineItem } from "@/domain/checkout/transformers/transformToShippingLineItem";
import { CartItem } from "@/domain/checkout/types/cartItem";

export const transformToCheckoutSessionLineItems = ({
  checkoutItems,
  shippingAddress,
  shouldHaveShippingAddress,
  orderWeight,
  complementaryTicketData,
}: {
  checkoutItems: CartItem[];
  shouldHaveShippingAddress: boolean;
  shippingAddress?: ShippingAddress;
  orderWeight: number;
  complementaryTicketData: ComplementaryTicketField;
}) => {
  const lineItems: CustomStripeLineItem[] = createProductLineItems(
    checkoutItems,
    complementaryTicketData
  );

  if (
    shouldAddShippingToCheckout(
      shouldHaveShippingAddress,
      shippingAddress,
      checkoutItems
    )
  ) {
    const shippingLineItem = transformToShippingLineItem(
      shippingAddress,
      orderWeight
    );
    lineItems.push(shippingLineItem);
  }
  return lineItems;
};
