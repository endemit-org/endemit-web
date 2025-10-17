import { Product } from "@/domain/product/types/product";
import { formatDateTime } from "@/lib/formatting";
import { isProductShippable } from "@/domain/product/businessLogic";
import { ensureDateType } from "@/lib/util";

export const getProductLimits = (product: Product) => {
  const limitMessages: string[] = [];
  const productLimit = product.limits;

  if (productLimit?.quantityLimit) {
    limitMessages.push(
      `Max quantity per purchase is ${productLimit.quantityLimit} items`
    );
  }

  if (
    productLimit?.regionalEligibility.length > 0 &&
    isProductShippable(product)
  ) {
    limitMessages.push(
      `Item only shippable to ${productLimit.regionalEligibility.map(region => region.region).join(", ")}`
    );
  }

  if (productLimit?.cutoffTimestamp) {
    const date = ensureDateType(productLimit.cutoffTimestamp);
    limitMessages.push(`Available only until ${formatDateTime(date)}`);
  }

  return limitMessages;
};
