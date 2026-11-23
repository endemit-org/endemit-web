import "server-only";

import crypto from "crypto";

/**
 * Generates a memorable OTC code with 2 uppercase letters + 2 digits
 * Examples: AB12, XY99, CD42
 *
 * Only 57,600 combinations, so the code is safe solely because verification
 * locks a token after a few wrong attempts (see verifyOtcCode).
 */
export const generateOtcCode = (): string => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excluding I and O to avoid confusion
  const digits = "0123456789";

  const pick = (alphabet: string) =>
    alphabet[crypto.randomInt(alphabet.length)];

  return `${pick(letters)}${pick(letters)}${pick(digits)}${pick(digits)}`;
};
