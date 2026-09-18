import "server-only";

import { OtcEmailQueueData } from "@/domain/auth/types";
import { queueOtcEmail } from "@/domain/auth/operations/queueOtcEmail";
import { sendOtcEmail } from "@/domain/email/operations/sendOtcEmail";

/**
 * Sends the OTC email directly for the fastest delivery. If the direct send
 * fails (Resend outage, network error), falls back to the Inngest queue so
 * the email is still delivered with retries.
 */
export const deliverOtcEmail = async (data: OtcEmailQueueData) => {
  try {
    const { error } = await sendOtcEmail(data);
    if (!error) {
      return;
    }
    console.error("Direct OTC email send failed, queueing instead:", error);
  } catch (error) {
    console.error("Direct OTC email send threw, queueing instead:", error);
  }

  await queueOtcEmail(data);
};
