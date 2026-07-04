import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformProductObject } from "@/domain/product/transformers/transformProductObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchProductsFromCms = async ({
  pageSize = 200,
  filters,
  locale = "sl",
}: {
  pageSize?: number;
  filters?: string[];
  locale?: AppLocale;
}) => {
  const products = await prismicClient.getAllByType("product", {
    pageSize,
    ...(filters && { filters }),
  });

  if (!products) {
    return null;
  }

  const productsWithRequiredAttributes = products.filter(
    product => product.data.price && product.data.price > 0
  );

  if (
    !productsWithRequiredAttributes ||
    productsWithRequiredAttributes.length === 0
  ) {
    return null;
  }

  const transformedProducts = [];
  for (const product of productsWithRequiredAttributes) {
    transformedProducts.push(await transformProductObject(product, locale));
  }
  return transformedProducts;
};
