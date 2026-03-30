import "server-only";

/**
 * Generates a memorable OTC code with 2 uppercase letters + 2 digits
 * Examples: AB12, XY99, CD42
 */
export const generateOtcCode = (): string => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excluding I and O to avoid confusion
  const digits = "0123456789";

  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  const digit1 = digits[Math.floor(Math.random() * digits.length)];
  const digit2 = digits[Math.floor(Math.random() * digits.length)];

  return `${letter1}${letter2}${digit1}${digit2}`;
};
