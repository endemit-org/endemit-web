import { Product, ProductCompositionType } from "@/types/product";
import { getProductId, getProductName } from "@/domain/product/product.actions";

export const getVariantSingleProducts = (product: Product) => {
  const variantSingleProducts: Product[] = [];

  product.variants.forEach(variant => {
    const productId = getProductId(product.uid, variant.variant_value);
    const productName = getProductName(product.name, variant.variant_value);

    const productWithVariant: Product = {
      ...product,
      id: productId,
      uid: productId,
      composition: ProductCompositionType.VARIANT,
      name: productName,
      variants: [variant],
    };
    variantSingleProducts.push(productWithVariant);
  });

  return variantSingleProducts;
};
