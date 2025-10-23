export const transformToVariantId = (productId: string, variant?: string) => {
  return variant ? `${productId}:${variant}` : productId;
};
