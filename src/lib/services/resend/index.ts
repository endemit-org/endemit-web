import { Resend } from "resend";
import {
  MERCHANT_EMAIL_ADDRESS,
  RESEND_FROM,
  RESEND_KEY,
} from "@/lib/services/env/private";

export const resend = new Resend(RESEND_KEY);
export const resendFromEmail = RESEND_FROM ?? "onboarding@resend.dev";
export const merchantToEmail = MERCHANT_EMAIL_ADDRESS;
