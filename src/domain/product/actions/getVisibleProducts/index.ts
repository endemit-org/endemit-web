import { Product } from "@/types/product";
import { isProductVisible } from "@/domain/product/businessLogic";

export const filterVisibleProducts = (products: Product[]) => {
  return products.filter(product => isProductVisible(product));
};
