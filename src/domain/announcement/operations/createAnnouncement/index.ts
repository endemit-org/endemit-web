import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { CreateAnnouncementInput } from "@/domain/announcement/types/announcement";
import { bustOnAnnouncementChanged } from "@/lib/services/cache";

/**
 * Create a new announcement and broadcast to all users.
 */
export async function createAnnouncement(input: CreateAnnouncementInput) {
  const announcement = await prisma.announcement.create({
    data: {
      title: input.title,
      message: input.message,
      type: input.type ?? "INFO",
      isActive: input.isActive ?? true,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });

  // Broadcast to all connected clients if active now
  const now = new Date();
  const isActiveNow =
    announcement.isActive &&
    (!announcement.startsAt || announcement.startsAt <= now) &&
    (!announcement.endsAt || announcement.endsAt > now);

  if (isActiveNow) {
    await broadcastToChannel("announcements:global", "announcement_created", {
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
    });
  }

  await bustOnAnnouncementChanged();

  return announcement;
}
