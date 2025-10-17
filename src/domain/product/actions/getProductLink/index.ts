import { createSlug } from "@/lib/util";
import { ProductCategory } from "@/domain/product/types/product";

export const getProductLink = (
  uid: string,
  category: ProductCategory,
  isAbsolute = false
) => {
  const removeVariantSuffix = (uid: string) => {
    return uid.replace(/:[^:]+$/, "");
  };
  return `${isAbsolute ? process.env.NEXT_PUBLIC_BASE_WEB_URL : ""}/store/${createSlug(category)}/${removeVariantSuffix(uid)}`;
};
