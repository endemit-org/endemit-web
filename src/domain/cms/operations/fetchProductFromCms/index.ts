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
