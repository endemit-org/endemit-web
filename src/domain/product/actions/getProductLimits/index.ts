import { Product } from "@/domain/product/types/product";
import { formatDateTime } from "@/lib/util/formatting";
import { isProductShippable } from "@/domain/product/businessLogic";
import { ensureTypeIsDate } from "@/lib/util/util";

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
    const date = ensureTypeIsDate(productLimit.cutoffTimestamp);
    limitMessages.push(`Available only until ${formatDateTime(date)}`);
  }

  return limitMessages;
};
