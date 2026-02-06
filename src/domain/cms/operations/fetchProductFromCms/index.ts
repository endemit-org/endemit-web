import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformProductObject } from "@/domain/product/transformers/transformProductObject";
import { ProductDocument } from "@/prismicio-types";

export const fetchProductFromCmsByUid = async (productUid: string) => {
  const prismicProduct = await prismicClient
    .getByUID("product", productUid)
    .catch(() => null);

  if (!prismicProduct) {
    return null;
  }

  return await transformProductObject(prismicProduct);
};

export const fetchProductFromCmsById = async (productId: string) => {
  const prismicProduct = (await prismicClient
    .getByID(productId)
    .catch(() => null)) as ProductDocument;

  if (!prismicProduct) {
    return null;
  }

  return await transformProductObject(prismicProduct);
};

export const fetchProductsFromCmsByIds = async (productIds: string[]) => {
  if (productIds.length === 0) {
    return [];
  }

  const prismicProducts = (await prismicClient
    .getByIDs(productIds)
    .catch(() => null)) as { results: ProductDocument[] } | null;

  if (!prismicProducts || !prismicProducts.results) {
    return [];
  }

  const products = await Promise.all(
    prismicProducts.results.map(product => transformProductObject(product))
  );

  return products;
};
