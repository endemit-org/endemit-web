import { ProductStatus } from "@/types/product";

export const getStatusTagStyle = (status: ProductStatus) => {
  switch (status) {
    case ProductStatus.AVAILABLE:
      return "bg-green-100 text-white";
    case ProductStatus.PREORDER:
      return "bg-orange-100 text-white";
    case ProductStatus.OUT_OF_STOCK:
      return "bg-red-100 text-white";
    case ProductStatus.COMING_SOON:
      return "bg-gray-200 text-gray-800";
    case ProductStatus.SOLD_OUT:
      return "gray";
    default:
      return "blue";
  }
};
