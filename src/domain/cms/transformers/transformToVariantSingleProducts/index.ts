import {
  Product,
  ProductCompositionType,
} from "@/domain/product/types/product";
import { transformToVariantId } from "@/domain/product/transformers/transformToVariantId";
import { transformToVariantName } from "@/domain/product/transformers/transformToVariantName";

export const getVariantSingleProducts = (product: Product) => {
  const variantSingleProducts: Product[] = [];

  product.variants.forEach(variant => {
    const productId = transformToVariantId(product.uid, variant.variant_value);
    const productName = transformToVariantName(
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
