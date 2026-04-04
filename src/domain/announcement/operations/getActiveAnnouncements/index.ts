import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Get active announcements for a user, excluding dismissed ones.
 * An announcement is active if:
 * - isActive = true
 * - (startsAt is null OR startsAt <= now)
 * - (endsAt is null OR endsAt > now)
 * - User has not dismissed it
 */
export async function getActiveAnnouncements(userId: string) {
  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        {
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      ],
      dismissals: {
        none: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return announcements;
}
