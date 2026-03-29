"use server";

import { verifyMagicLink } from "@/domain/auth/operations/verifyMagicLink";
import type { OtcVerifyResult } from "@/domain/auth/types";

export const verifyMagicLinkAction = async (
  token: string
): Promise<OtcVerifyResult> => {
  return verifyMagicLink(token);
};
