import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Dismiss an announcement for a specific user.
 * Uses upsert to handle duplicate dismissals gracefully.
 */
export async function dismissAnnouncement(announcementId: string, userId: string) {
  const dismissal = await prisma.announcementDismissal.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId,
      },
    },
    update: {},
    create: {
      announcementId,
      userId,
    },
  });

  return dismissal;
}
