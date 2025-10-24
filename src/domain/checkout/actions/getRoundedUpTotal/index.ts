export const getRoundedUpTotal = (amount: number) => {
  const fivePercent = Math.ceil((amount * 1.05) / 10) * 10;
  const increase = fivePercent - amount;

  // If 5% rounded stays within 15 EUR, use it
  if (increase <= 15) {
    return fivePercent;
  }

  // Otherwise, add 15 and round DOWN to nearest 10
  return Math.floor((amount + 15) / 10) * 10;
};
