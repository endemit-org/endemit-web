import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformProductObject } from "@/domain/product/transformers/transformProductObject";
import { ProductDocument } from "@/prismicio-types";
import type { AppLocale } from "@/i18n/routing";

export const fetchProductFromCmsByUid = async (
  productUid: string,
  locale: AppLocale = "sl"
) => {
  const prismicProduct = await prismicClient
    .getByUID("product", productUid)
    .catch(() => null);

  if (!prismicProduct) {
    return null;
  }

  return await transformProductObject(prismicProduct, locale);
};

export const fetchProductFromCmsById = async (
  productId: string,
  locale: AppLocale = "sl"
) => {
  const prismicProduct = (await prismicClient
    .getByID(productId)
    .catch(() => null)) as ProductDocument;

  if (!prismicProduct) {
    return null;
  }

  return await transformProductObject(prismicProduct, locale);
};

export const fetchProductsFromCmsByIds = async (
  productIds: string[],
  locale: AppLocale = "sl"
) => {
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
    prismicProducts.results.map(product =>
      transformProductObject(product, locale)
    )
  );

  return products;
};
