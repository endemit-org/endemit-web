import { Product } from "@/domain/product/types/product";
import {
  isProductShippable,
  isCutoffWithin48Hours,
} from "@/domain/product/businessLogic";
import { ensureTypeIsDate } from "@/lib/util/util";

/**
 * Structured product-limit descriptors. Rendering components translate these
 * via the `store.product.limits.*` messages (the raw strings used to be built
 * here, which bypassed i18n).
 */
export type ProductLimit =
  | { type: "maxQuantity"; quantity: number }
  | { type: "regional"; regions: string }
  | { type: "availableUntil"; date: Date }
  | { type: "limitedAvailability" };

export const getProductLimits = (product: Product): ProductLimit[] => {
  const limits: ProductLimit[] = [];
  const productLimit = product.limits;

  if (productLimit?.quantityLimit) {
    limits.push({ type: "maxQuantity", quantity: productLimit.quantityLimit });
  }

  if (
    productLimit?.regionalEligibility.length > 0 &&
    isProductShippable(product)
  ) {
    limits.push({
      type: "regional",
      regions: productLimit.regionalEligibility
        .map(region => region.region)
        .join(", "),
    });
  }

  if (productLimit?.cutoffTimestamp) {
    if (isCutoffWithin48Hours(product)) {
      limits.push({
        type: "availableUntil",
        date: ensureTypeIsDate(productLimit.cutoffTimestamp),
      });
    } else {
      limits.push({ type: "limitedAvailability" });
    }
  }

  return limits;
};
