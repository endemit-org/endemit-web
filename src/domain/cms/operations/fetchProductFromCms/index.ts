import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformProductObject } from "@/domain/product/transformers/transformProductObject";

export const fetchProductFromCms = async (productUid: string) => {
  const prismicProduct = await prismicClient
    .getByUID("product", productUid)
    .catch(() => null);

  if (!prismicProduct) {
    return null;
  }

  return transformProductObject(prismicProduct);
};
