/**
 * The total a donation prompt rounds up to.
 *
 * Small carts round in 5 EUR steps, larger ones in 10 EUR steps. With a
 * flat 10 EUR step, a small total already on a round number (20, 40)
 * jumped a full 10 EUR, which read as an outsized ask; above 40 EUR a
 * 10 EUR step is proportionate again.
 */
const SMALL_CART_LIMIT = 40;

const getStep = (amount: number) => (amount <= SMALL_CART_LIMIT ? 5 : 10);

export const getRoundedUpTotal = (amount: number) => {
  const step = getStep(amount);
  const fivePercent = Math.ceil((amount * 1.05) / step) * step;
  const increase = fivePercent - amount;

  // If 5% rounded stays within 15 EUR, use it
  if (increase <= 15) {
    return fivePercent;
  }

  // Otherwise, add 15 and round DOWN to the nearest step
  return Math.floor((amount + 15) / step) * step;
};
