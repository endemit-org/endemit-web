import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  AnnouncementWithStatus,
  getAnnouncementStatus,
} from "@/domain/announcement/types/announcement";

/**
 * Get all announcements for admin view, with computed status.
 */
export async function getAllAnnouncements(): Promise<AnnouncementWithStatus[]> {
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
