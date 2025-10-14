export const transformPriceToStripe = (price: number) =>
  Math.round(price * 100);

export const transformPriceFromStripe = (price: number) =>
  Math.round(price / 100);
