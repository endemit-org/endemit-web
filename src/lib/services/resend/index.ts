import { Resend } from "resend";
import {
  MERCHANT_EMAIL_ADDRESS,
  RESEND_FROM,
  RESEND_KEY,
  DISPATCHER_EMAIL_ADDRESS,
} from "@/lib/services/env/private";

export const resend = new Resend(RESEND_KEY);
export const resendFromEmail = RESEND_FROM ?? "onboarding@resend.dev";
export const merchantToEmail = MERCHANT_EMAIL_ADDRESS;
export const dispatcherToEmail = DISPATCHER_EMAIL_ADDRESS;

// Blocked email domains (e.g., import placeholders)
const BLOCKED_EMAIL_DOMAINS = ["import.endemit.org"];

export const isBlockedEmail = (email: string): boolean => {
  const domain = email.split("@")[1]?.toLowerCase();
  return BLOCKED_EMAIL_DOMAINS.includes(domain);
};
