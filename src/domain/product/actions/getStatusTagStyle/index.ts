import { ProductStatus } from "@/domain/product/types/product";

export const getStatusTagStyle = (status: ProductStatus) => {
  switch (status) {
    case ProductStatus.AVAILABLE:
      return "";

    case ProductStatus.PREORDER:
      return "bg-neutral-950 text-neutral-200";

    case ProductStatus.COMING_SOON:
      return "bg-blue-700 text-neutral-200";

    case ProductStatus.OUT_OF_STOCK:
    case ProductStatus.SOLD_OUT:
    default:
      return "bg-neutral-200 text-neutral-800";
  }
};
