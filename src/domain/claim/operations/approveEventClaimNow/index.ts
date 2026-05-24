import "server-only";

import { prisma } from "@/lib/services/prisma";
import { approveEventClaim } from "@/domain/claim/operations/approveEventClaim";
import { sendEventClaimApprovalEmail } from "@/domain/email/operations/sendEventClaimApprovalEmail";

export async function approveEventClaimNow(claimId: string) {
  const existing = await prisma.eventClaim.findUnique({
    where: { id: claimId },
    include: { user: { select: { email: true } } },
  });

  if (!existing) {
    throw new Error("Event claim not found");
  }

  if (existing.status === "APPROVED") {
    return existing;
  }

  const claim = await approveEventClaim(claimId);

  if (existing.user.email) {
    try {
      await sendEventClaimApprovalEmail({
        email: existing.user.email,
        eventName: claim.eventName,
      });
    } catch (err) {
      console.error("Failed to send claim approval email:", err);
    }
  }

  return claim;
}
