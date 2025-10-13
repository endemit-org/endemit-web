export const getProductVariantId = (productId: string, variant?: string) => {
  return variant ? `${productId}:${variant}` : productId;
};
