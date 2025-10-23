import { getSlugFromText } from "@/lib/util/util";
import { ProductCategory } from "@/domain/product/types/product";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

export const getProductLink = (
  uid: string,
  category: ProductCategory,
  isAbsolute = false
) => {
  const removeVariantSuffix = (uid: string) => {
    return uid.replace(/:[^:]+$/, "");
  };
  return `${isAbsolute ? PUBLIC_BASE_WEB_URL : ""}/store/${getSlugFromText(category)}/${removeVariantSuffix(uid)}`;
};
