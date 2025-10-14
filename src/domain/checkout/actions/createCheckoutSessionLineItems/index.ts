import {
  ComplementaryTicketField,
  CustomStripeLineItem,
  ShippingAddress,
} from "@/types/checkout";
import {
  createProductLineItems,
  createShippingLineItem,
} from "@/domain/checkout/actions";
import { CartItem } from "@/types/cart";
import { includesShippableProduct } from "@/domain/checkout/businessRules";

export const createCheckoutSessionLineItems = ({
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
    shouldHaveShippingAddress &&
    shippingAddress &&
    includesShippableProduct(checkoutItems)
  ) {
    const shippingLineItem = createShippingLineItem(
      shippingAddress,
      orderWeight
    );
    lineItems.push(shippingLineItem);
  }
  return lineItems;
};
