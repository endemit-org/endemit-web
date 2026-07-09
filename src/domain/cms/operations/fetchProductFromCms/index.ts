import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformProductObject } from "@/domain/product/transformers/transformProductObject";
import { ProductDocument } from "@/prismicio-types";
import type { AppLocale } from "@/i18n/routing";

// related_products (product) and related_to_event (event) are linked docs whose
// data is embedded field-by-field. List the fields the transformer reads —
// including the `_sl` twins — so related products localize instead of falling
// back to English. related_to_event fields are universal but must be listed too
// so the linked event keeps resolving once fetchLinks is set.
export const PRODUCT_FETCH_LINKS = [
  "product.title",
  "product.title_sl",
  "product.description",
  "product.description_sl",
  "product.product_category",
  "product.product_type",
  "product.product_status",
  "product.product_visibility",
  "product.images",
  "product.price",
  "product.sorting_weight",
  "event.title",
  "event.date_start",
  "event.has_cashless_payments",
];

export const fetchProductFromCmsByUid = async (
  productUid: string,
  locale: AppLocale = "sl"
) => {
  const prismicProduct = await prismicClient
    .getByUID("product", productUid, { fetchLinks: PRODUCT_FETCH_LINKS })
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
    .getByID(productId, { fetchLinks: PRODUCT_FETCH_LINKS })
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
    .getByIDs(productIds, { fetchLinks: PRODUCT_FETCH_LINKS })
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
