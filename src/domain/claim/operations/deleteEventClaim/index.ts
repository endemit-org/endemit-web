import "server-only";

import { prisma } from "@/lib/services/prisma";
import { bustOnClaimApproved } from "@/lib/services/cache";

export async function deleteEventClaim(claimId: string): Promise<void> {
  const claim = await prisma.eventClaim.findUnique({
    where: { id: claimId },
    select: { userId: true },
  });

  if (!claim) {
    throw new Error("Event claim not found");
  }

  await prisma.eventClaim.delete({ where: { id: claimId } });

  await bustOnClaimApproved(claim.userId);
}
