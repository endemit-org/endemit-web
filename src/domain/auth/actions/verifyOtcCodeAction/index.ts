"use server";

import { verifyOtcCode } from "@/domain/auth/operations/verifyOtcCode";
import type { OtcVerifyResult } from "@/domain/auth/types";

interface VerifyOtcCodeParams {
  email: string;
  code: string;
}

export const verifyOtcCodeAction = async ({
  email,
  code,
}: VerifyOtcCodeParams): Promise<OtcVerifyResult> => {
  return verifyOtcCode({
    email: email.toLowerCase().trim(),
    code: code.toUpperCase().trim(),
  });
};
