"use server";

import { verifyMagicLink } from "@/domain/auth/operations/verifyMagicLink";
import { createUserSession } from "@/lib/services/auth";
import type { OtcVerifyResult } from "@/domain/auth/types";

export const verifyMagicLinkAction = async (
  token: string
): Promise<OtcVerifyResult> => {
  const result = await verifyMagicLink(token);

  // Create session if verification was successful
  if (result.success && result.userId) {
    await createUserSession(result.userId);
  }

  return result;
};
