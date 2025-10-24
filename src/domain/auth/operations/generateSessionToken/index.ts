import "server-only";

import { randomBytes } from "crypto";

export const generateSessionToken = (): string => {
  return randomBytes(32).toString("hex");
};
