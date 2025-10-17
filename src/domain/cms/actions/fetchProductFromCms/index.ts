import { prismicClient } from "@/services/prismic";
import { PrismicProductDocument } from "@/domain/cms/types/prismic";
import { getFormattedProduct } from "@/domain/product/actions";

export const fetchProductFromCms = async (productUid: string) => {
  const prismicProduct = (await prismicClient
    .getByUID("product", productUid)
    .catch(() => null)) as PrismicProductDocument;

  if (!prismicProduct) {
    return null;
  }

  const productWithCompositionType = getFormattedProduct(prismicProduct);

  return productWithCompositionType;
};
