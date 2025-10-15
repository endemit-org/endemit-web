import { prismicClient } from "@/services/prismic";
import { PrismicProductDocument } from "@/types/prismic";
import { getFormattedProduct } from "@/domain/product/actions";

export const fetchProductFromCms = async (productId: string) => {
  const prismicProduct = (await prismicClient
    .getByUID("product", productId)
    .catch(() => null)) as PrismicProductDocument;

  const productWithCompositionType = getFormattedProduct(prismicProduct);

  return productWithCompositionType;
};
