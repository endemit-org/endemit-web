import {
  Product,
  ProductCompositionType,
} from "@/domain/product/types/product";
import { getProductVariantName } from "@/domain/product/actions/getProductVariantName";
import { getProductVariantId } from "@/domain/product/actions/getProductVariantId";

export const getVariantSingleProducts = (product: Product) => {
  const variantSingleProducts: Product[] = [];

  product.variants.forEach(variant => {
    const productId = getProductVariantId(product.uid, variant.variant_value);
    const productName = getProductVariantName(
      product.name,
      variant.variant_value
    );

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
