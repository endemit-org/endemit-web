export const getRoundedUpTotal = (amount: number) => {
  const rounded = Math.ceil(amount / 10) * 10;
  const fivePercent = Math.ceil((amount * 1.05) / 10) * 10;

  return Math.max(rounded, fivePercent);
};
