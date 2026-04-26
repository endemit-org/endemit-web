import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  EventClaimQueueEvent,
  EventClaimQueueData,
} from "@/domain/claim/types";
import { approveEventClaim } from "@/domain/claim/operations/approveEventClaim";
import { sendEventClaimApprovalEmail } from "@/domain/email/operations/sendEventClaimApprovalEmail";
import { prisma } from "@/lib/services/prisma";

export const runEventClaimAutomation = inngest.createFunction(
  {
    id: "event-claim-process",
    retries: 3,
    triggers: [{ event: EventClaimQueueEvent.PROCESS_CLAIM }],
  },
  async ({ event, step }) => {
    const { claimId, userEmail, eventName } = event.data as EventClaimQueueData;

    // Wait 5 minutes before processing (simulating review period)
    await step.sleep("wait-for-review", "5m");

    // Check if claim still exists and is pending (user might have cancelled)
    const claim = await step.run("verify-claim-status", async () => {
      return await prisma.eventClaim.findUnique({
        where: { id: claimId },
      });
    });

    if (!claim || claim.status !== "PENDING") {
      return {
        success: false,
        reason: claim ? "Claim already processed" : "Claim not found",
      };
    }

    // Approve the claim
    await step.run("approve-claim", async () => {
      await approveEventClaim(claimId);
    });

    // Send confirmation email
    await step.run("send-confirmation-email", async () => {
      await sendEventClaimApprovalEmail({
        email: userEmail,
        eventName,
      });
    });

    return { success: true, claimId };
  }
);
