import "server-only";

import { prisma } from "@/lib/services/prisma";

export const approveEventClaim = async (claimId: string) => {
  return await prisma.eventClaim.update({
    where: { id: claimId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });
};
