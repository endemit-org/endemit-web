export const transformPriceFromStripe = (price: number) =>
  Math.round(price / 100);
