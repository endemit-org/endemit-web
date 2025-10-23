import { Product } from "@/domain/product/types/product";

export interface CartItem extends Product {
  quantity: number;
}
