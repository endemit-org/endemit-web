export const transformToVariantName = (
  productName: string,
  variant?: string
) => {
  return variant ? `${productName} - ${variant}` : productName;
};
