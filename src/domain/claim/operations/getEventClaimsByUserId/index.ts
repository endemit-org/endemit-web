import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { CacheTags } from "@/lib/services/cache";

const getEventClaimsByUserIdUncached = async (userId: string) => {
  return await prisma.eventClaim.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

const getApprovedEventClaimsByUserIdUncached = async (userId: string) => {
  return await prisma.eventClaim.findMany({
    where: {
      userId,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get all event claims for a user (cached)
 */
export const getEventClaimsByUserId = (userId: string) => {
  return unstable_cache(
    () => getEventClaimsByUserIdUncached(userId),
    ["claims-user", userId],
    { tags: [CacheTags.user.claims(userId)] }
  )();
};

/**
 * Get approved event claims for a user (cached)
 */
export const getApprovedEventClaimsByUserId = (userId: string) => {
  return unstable_cache(
    () => getApprovedEventClaimsByUserIdUncached(userId),
    ["claims-approved-user", userId],
    { tags: [CacheTags.user.claimsApproved(userId)] }
  )();
};
