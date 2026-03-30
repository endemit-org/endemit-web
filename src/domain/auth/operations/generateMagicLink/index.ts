import "server-only";

import { randomBytes } from "crypto";

/**
 * Generates a secure random magic link token
 */
export const generateMagicLink = (): string => {
  return randomBytes(32).toString("hex");
};
