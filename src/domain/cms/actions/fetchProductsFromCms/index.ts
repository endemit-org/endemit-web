import { prismicClient } from "@/services/prismic";
import { PrismicProductDocument } from "@/domain/cms/types/prismic";
import { getFormattedProduct } from "@/domain/product/actions";

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

  if (!products) {
    return null;
  }

  const productsWithRequiredAttributes = products.filter(
    (product: PrismicProductDocument) =>
      product.data.price && product.data.price > 0
  );

  if (
    !productsWithRequiredAttributes ||
    productsWithRequiredAttributes.length === 0
  ) {
    return null;
  }

  const productsWithCompositionType = productsWithRequiredAttributes.map(
    product => getFormattedProduct(product)
  );

  return productsWithCompositionType;
};
