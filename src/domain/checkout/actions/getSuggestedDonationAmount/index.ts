export function getSuggestedDonationAmount(
  rounded: number,
  total: number
): number {
  return Math.round(Math.ceil(rounded) - total);
}
