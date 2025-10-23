import {
  Product,
  ProductCompositionType,
} from "@/domain/product/types/product";
import { CountryCode } from "@/domain/checkout/types/country";
import { isProductSellable } from "@/domain/product/businessLogic";
import { getVariantSingleProducts } from "@/domain/cms/transformers/transformToVariantSingleProducts";

export const getValidProducts = (
  products: Product[],
  shippingCountry: CountryCode | undefined
): Product[] => {
  const validProducts: Product[] = [];

  products
    .filter(product => isProductSellable(product, shippingCountry).isSellable)
    .forEach(product => {
      if (product.composition === ProductCompositionType.CONFIGURABLE) {
        const variants = getVariantSingleProducts(product);
        variants.forEach(variant => validProducts.push(variant));
      } else {
        validProducts.push(product);
      }
    });

  return validProducts;
};
