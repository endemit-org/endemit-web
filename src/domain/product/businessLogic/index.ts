import {
  Product,
  ProductCategory,
  ProductCompositionType,
  ProductStatus,
  ProductType,
  ProductVisibility,
} from "@/domain/product/types/product";
import { Country, Region } from "@/types/country";
import { getRegionFromCountry } from "../../../../lib/util";

export const isProductSellableByCutoffDate = (product: Product) => {
  if (!product.limits?.cutoffTimestamp) {
    return true; // If no cutoff date is set, assume it's sellable
  }
  const now = new Date();
  const cutoffDate = new Date(product.limits.cutoffTimestamp);
  const isWithinCutoff = now.getTime() <= cutoffDate.getTime();

  return isWithinCutoff;
};

export const isProductSellableByRegion = (product: Product, region: Region) => {
  if (!product.limits?.regionalEligibility) {
    return true;
  }
  if (product.limits.regionalEligibility.length === 0) {
    return true; // If no regional eligibility is set, assume it's sellable everywhere
  }
  return (
    product.limits.regionalEligibility.filter(
      productItem => productItem.region === region
    ).length > 0
  );
};
export const isProductSellableByStatus = (product: Product) => {
  return (
    product.status === ProductStatus.AVAILABLE ||
    product.status === ProductStatus.PREORDER
  );
};
export const isProductSellable = (product: Product, country?: Country) => {
  let isSellableByRegion = true;

  if (country && isProductShippable(product)) {
    const region = getRegionFromCountry(country);
    if (!region) {
      isSellableByRegion = false;
    } else {
      isSellableByRegion = isProductSellableByRegion(product, region);
    }
  }

  const isSellableByStatus = isProductSellableByStatus(product);
  const isSellableByCutoffDate = isProductSellableByCutoffDate(product);

  return {
    isSellableByCutoffDate,
    isSellableByStatus,
    isSellableByRegion,
    isSellable:
      isSellableByStatus && isSellableByRegion && isSellableByCutoffDate,
  };
};
export const isProductShippable = (product: Product) => {
  return product.type === ProductType.PHYSICAL;
};
export const isProductDigital = (product: Product) => {
  return product.type === ProductType.DIGITAL;
};
export const isProductVisible = (product: Product) => {
  return product.visibility === ProductVisibility.VISIBLE;
};
export const isProductTicket = (product: Product) => {
  return product.category === ProductCategory.TICKETS;
};
export const isProductDonation = (product: Product) => {
  return product.category === ProductCategory.DONATIONS;
};
export const isProductConfigurable = (product: Product) => {
  return product.composition === ProductCompositionType.CONFIGURABLE;
};
export const isProductExcludedFromRefunds = (product: Product) => {
  return isProductTicket(product);
};
export const isProductFeatured = (product: Product) => {
  return product.isFeatured;
};
export const canProductExistInCart = (product: Product) => {
  return (
    product.composition === ProductCompositionType.SINGLE ||
    product.composition === ProductCompositionType.VARIANT
  );
};
