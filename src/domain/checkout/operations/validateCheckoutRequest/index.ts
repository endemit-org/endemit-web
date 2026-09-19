import "server-only";

import {
  CheckoutSessionRequestBody,
  DeliveryMethod,
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
  const shouldHaveShippingAddress = includesShippableProduct(items);
  // Pickup is only a choice when there is something physical to hand over
  const deliveryMethod =
    shouldHaveShippingAddress &&
    body.formData?.deliveryMethod === DeliveryMethod.PICKUP
      ? DeliveryMethod.PICKUP
      : DeliveryMethod.SHIPPING;
  const isPickup = deliveryMethod === DeliveryMethod.PICKUP;

  const rawAddress = body.shippingAddress as ShippingAddress | undefined;
  // Pickup keeps only the contact; goods are handed over in Slovenia
  const shippingAddress: ShippingAddress | undefined =
    isPickup && rawAddress
      ? {
          name: rawAddress.name,
          phone: rawAddress.phone,
          country: "SI",
          address: "",
          city: "",
          postalCode: "",
        }
      : rawAddress;

  validateBasicFields(body.email, body.termsAndConditions);

  const formErrors = CheckoutValidationService.validateForm({
    formData: { ...body.formData, deliveryMethod },
    requiresShippingAddress: shouldHaveShippingAddress,
    items,
  });

  if (!CheckoutValidationService.isFormValid(formErrors)) {
    throw new Error("Form validation failed");
  }

  const validProducts = getValidProducts(products, shippingAddress?.country);
  const checkoutItems = transformToItemsForPayment(items, validProducts);

  validateCheckoutItems(checkoutItems);

  const orderWeight = getCheckoutWeight(checkoutItems);
  const shippingCost = isPickup
    ? 0
    : getCalculatedShippingCost(
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
    deliveryMethod,
    pickupEventUid: body.formData?.pickupEventUid ?? "",
    complementaryTicketData: body.complementaryTicketData || undefined,
    subscribeToNewsletter: body.subscribeToNewsletter || false,
    discountCodeId: body.discountCodeId || undefined,
    subtotal,
    shippingCost,
    walletCreditAmount: body.walletCreditAmount || 0,
  };
};
