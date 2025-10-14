import { CartItem } from "@/types/cart";
import { CheckoutSessionRequestBody, ShippingAddress } from "@/types/checkout";
import { CheckoutValidationService } from "@/services/validation/validation.service";
import { includesShippableProduct } from "@/domain/checkout/businessRules";
import { Product, ProductCompositionType } from "@/types/product";
import { isProductSellable } from "@/domain/product/businessLogic";
import { getVariantSingleProducts } from "@/domain/cms/actions/getVariantSingleProducts";
import {
  getCheckoutWeight,
  parseItemsForPayment,
} from "@/domain/checkout/actions";
import shippingService from "@/services/shipping";
import { Country } from "@/types/country";

export const validateCheckoutRequest = (
  body: CheckoutSessionRequestBody,
  products: Product[]
) => {
  const items = body.items as CartItem[];
  const email = body.email;
  const termsAndConditions = body.termsAndConditions;
  const shippingAddress = body.shippingAddress as ShippingAddress | undefined;
  const shouldHaveShippingAddress = includesShippableProduct(items);

  if (!email) throw new Error("Email is required");
  if (!termsAndConditions)
    throw new Error("Terms and conditions must be accepted");

  const isFormValid = CheckoutValidationService.validateForm({
    formData: body.formData,
    requiresShippingAddress: shouldHaveShippingAddress,
    items,
  });

  if (!isFormValid) throw new Error("Form validation failed");

  const validProducts: Product[] = [];

  products
    .filter(
      product => isProductSellable(product, shippingAddress?.country).isSellable
    )
    .forEach(product => {
      if (product.composition === ProductCompositionType.CONFIGURABLE) {
        const variants = getVariantSingleProducts(product);
        variants.forEach(variant => validProducts.push(variant));
      } else {
        validProducts.push(product);
      }
    });

  const checkoutItems = parseItemsForPayment(items, validProducts);
  const orderWeight = getCheckoutWeight(checkoutItems);

  if (checkoutItems.length === 0)
    throw new Error("There are no valid items for checkout");
  if (!checkoutItems.every(item => item.price && item.price > 0)) {
    throw new Error("One or more items have invalid prices");
  }

  const shippingCost =
    shouldHaveShippingAddress &&
    shippingAddress &&
    includesShippableProduct(checkoutItems)
      ? shippingService.calculateShippingCost(
          shippingAddress.country as Country,
          orderWeight
        ).cost
      : 0;

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    name: body.formData.name,
    email,
    checkoutItems,
    orderWeight,
    formData: body.formData,
    termsAndConditions,
    shippingAddress,
    shouldHaveShippingAddress,
    complementaryTicketData: body.complementaryTicketData || undefined,
    subscribeToNewsletter: body.subscribeToNewsletter || false,
    discountCodeId: body.discountCodeId || undefined,
    subtotal,
    shippingCost,
  };
};
