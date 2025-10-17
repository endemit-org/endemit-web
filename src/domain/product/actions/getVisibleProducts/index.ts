import { Product } from "@/domain/product/types/product";
import { isProductVisible } from "@/domain/product/businessLogic";

export const filterVisibleProducts = (products: Product[]) => {
  return products.filter(product => isProductVisible(product));
};
