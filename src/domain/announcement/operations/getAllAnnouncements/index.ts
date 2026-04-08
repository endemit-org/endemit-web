import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import {
  AnnouncementWithStatus,
  getAnnouncementStatus,
} from "@/domain/announcement/types/announcement";
import { CacheTags } from "@/lib/services/cache";

/**
 * Get all announcements for admin view, with computed status (uncached).
 */
async function getAllAnnouncementsUncached(): Promise<AnnouncementWithStatus[]> {
  const announcements = await prisma.announcement.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return announcements.map(announcement => ({
    ...announcement,
    status: getAnnouncementStatus(announcement),
  }));
}

/**
 * Get all announcements for admin view (cached)
 */
export function getAllAnnouncements(): Promise<AnnouncementWithStatus[]> {
  return unstable_cache(getAllAnnouncementsUncached, ["admin-announcements"], {
    tags: [CacheTags.admin.announcements.list()],
  })();
}
