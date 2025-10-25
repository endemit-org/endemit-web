import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformProductObject } from "@/domain/product/transformers/transformProductObject";

export const fetchProductsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
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

  return productsWithRequiredAttributes.map(product =>
    transformProductObject(product)
  );
};
