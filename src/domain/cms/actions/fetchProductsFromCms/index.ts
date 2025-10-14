import { prismicClient } from "@/services/prismic";
import { PrismicProductDocument } from "@/types/prismic";
import { getFormattedProduct } from "@/domain/cms/actions";

export const fetchProductsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const products = (await prismicClient.getAllByType("product", {
    pageSize,
    ...(filters && { filters }),
  })) as PrismicProductDocument[];

  const productsWithRequiredAttributes = products.filter(
    (product: PrismicProductDocument) =>
      product.data.price && product.data.price > 0
  );

  const productsWithCompositionType = productsWithRequiredAttributes.map(
    product => getFormattedProduct(product)
  );

  return productsWithCompositionType;
};
