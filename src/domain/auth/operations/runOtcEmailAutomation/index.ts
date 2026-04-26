import "server-only";

import { inngest } from "@/lib/services/inngest";
import { OtcQueueEvent, OtcEmailQueueData } from "@/domain/auth/types";
import { sendOtcEmail } from "@/domain/email/operations/sendOtcEmail";

export const runOtcEmailAutomation = inngest.createFunction(
  {
    id: "send-otc-email-function",
    retries: 3,
    triggers: [{ event: OtcQueueEvent.SEND_OTC_EMAIL }],
  },
  async ({ event, step }) => {
    const { email, code, magicLink, expiresInMinutes } =
      event.data as OtcEmailQueueData;

    await step.run("send-otc-email", async () => {
      await sendOtcEmail({
        email,
        code,
        magicLink,
        expiresInMinutes,
      });
    });

    return { success: true, email };
  }
);
