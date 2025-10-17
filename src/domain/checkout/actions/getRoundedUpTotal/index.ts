export const getRoundedUpTotal = (amount: number) => {
  const rounded = Math.ceil(amount / 10) * 10;

  // If we want to implement the 5% rule again in the future, uncomment below:
  // const fivePercent = Math.ceil((amount * 1.05) / 10) * 10;
  // return Math.max(rounded, fivePercent);

  return rounded;
};
