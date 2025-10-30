export const ConvertGramToKilogram = (grams: number) => {
  return grams / 1000;
};
export const convertKilogramToGram = (kilograms: number) => {
  return Math.round(kilograms * 1000);
};
export const convertSecondsToMs = (seconds: number) => {
  return seconds * 1000;
};
export const convertMinutesToMs = (minutes: number) => {
  return minutes * 60 * 1000;
};
export const convertHoursToMs = (hours: number) => {
  return hours * 60 * 60 * 1000;
};
export const convertMonthsToMs = (months: number) => {
  return months * 30 * 24 * 60 * 60 * 1000;
};
