import "server-only";

import {
  CheckoutSessionRequestBody,
  ShippingAddress,
} from "@/domain/checkout/types/checkout";
import { CheckoutValidationService } from "@/lib/services/validation/validation.service";
import { includesShippableProduct } from "@/domain/checkout/businessRules";
import { Product } from "@/domain/product/types/product";
import { transformToItemsForPayment } from "@/domain/checkout/transformers/transformToItemsForPayment";
import { getCheckoutWeight } from "@/domain/checkout/actions/getCheckoutWeight";
import { CartItem } from "@/domain/checkout/types/cartItem";
import { getValidProducts } from "@/domain/checkout/actions/getValidProducts";
import { getCalculatedShippingCost } from "@/domain/checkout/actions/getCalculatedShippingCost";
import { validateBasicFields } from "@/domain/checkout/actions/validateBasicFields";
import { validateCheckoutItems } from "@/domain/checkout/actions/validateCheckoutItems";
import { getCalculatedSubtotal } from "@/domain/checkout/actions/getCalculatedSubtotal";
import { transformToNormalizedShippingAddress } from "@/domain/checkout/transformers/transformToNormalizedShippingAddress";

export const validateCheckoutRequest = (
  body: CheckoutSessionRequestBody,
  products: Product[]
) => {
  const items = body.items as CartItem[];
  const shippingAddress = body.shippingAddress as ShippingAddress | undefined;
  const shouldHaveShippingAddress = includesShippableProduct(items);

  validateBasicFields(body.email, body.termsAndConditions);

  const isFormValid = CheckoutValidationService.validateForm({
    formData: body.formData,
    requiresShippingAddress: shouldHaveShippingAddress,
    items,
  });

  if (!isFormValid) throw new Error("Form validation failed");

  const validProducts = getValidProducts(products, shippingAddress?.country);
  const checkoutItems = transformToItemsForPayment(items, validProducts);

  validateCheckoutItems(checkoutItems);

  const orderWeight = getCheckoutWeight(checkoutItems);
  const shippingCost = getCalculatedShippingCost(
    shouldHaveShippingAddress,
    shippingAddress,
    checkoutItems,
    orderWeight
  );

  transformToNormalizedShippingAddress(
    shouldHaveShippingAddress,
    shippingAddress
  );

  const subtotal = getCalculatedSubtotal(checkoutItems);

  return {
    name: body.formData.name,
    email: body.email,
    checkoutItems,
    orderWeight,
    formData: body.formData,
    termsAndConditions: body.termsAndConditions,
    shippingAddress,
    shouldHaveShippingAddress,
    complementaryTicketData: body.complementaryTicketData || undefined,
    subscribeToNewsletter: body.subscribeToNewsletter || false,
    discountCodeId: body.discountCodeId || undefined,
    subtotal,
    shippingCost,
  };
};
