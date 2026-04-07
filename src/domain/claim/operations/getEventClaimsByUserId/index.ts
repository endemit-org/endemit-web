import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getEventClaimsByUserId = async (userId: string) => {
  return await prisma.eventClaim.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getApprovedEventClaimsByUserId = async (userId: string) => {
  return await prisma.eventClaim.findMany({
    where: {
      userId,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
  });
};
