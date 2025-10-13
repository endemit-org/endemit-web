export const getProductVariantName = (
  productName: string,
  variant?: string
) => {
  return variant ? `${productName} - ${variant}` : productName;
};
