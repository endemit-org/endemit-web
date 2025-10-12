export const getCheckoutTotals = (subTotal: number, shippingCost: number) => {
  return {
    subTotal,
    shippingCost,
    total: subTotal + shippingCost,
  };
};
