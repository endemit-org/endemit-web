import { Product } from "@/types/product";
import { formatDateTime } from "@/lib/formatting";
import { isProductShippable } from "@/domain/product/businessLogic";
import { ensureDateType } from "@/lib/util";

export const getProductLimits = (product: Product) => {
  const limitMessages: string[] = [];
  const productLimit = product.limits;

  if (productLimit?.quantityLimit) {
    limitMessages.push(`Max quantity: ${productLimit.quantityLimit}`);
  }

  if (
    productLimit?.regionalEligibility.length > 0 &&
    isProductShippable(product)
  ) {
    limitMessages.push(
      `Available only in: ${productLimit.regionalEligibility.map(region => region.region).join(", ")}`
    );
  }

  if (productLimit?.cutoffTimestamp) {
    const date = ensureDateType(productLimit.cutoffTimestamp);
    limitMessages.push(`Available until: ${formatDateTime(date)}`);
  }

  return limitMessages;
};
