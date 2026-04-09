import "server-only";

import { prisma } from "@/lib/services/prisma";
import { bustOnClaimApproved } from "@/lib/services/cache";

export const approveEventClaim = async (claimId: string) => {
  const claim = await prisma.eventClaim.update({
    where: { id: claimId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  await bustOnClaimApproved(claim.userId);

  return claim;
};
