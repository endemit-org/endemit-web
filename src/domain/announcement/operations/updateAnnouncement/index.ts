import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { UpdateAnnouncementInput } from "@/domain/announcement/types/announcement";

/**
 * Update an announcement and broadcast changes.
 */
export async function updateAnnouncement(input: UpdateAnnouncementInput) {
  const announcement = await prisma.announcement.update({
    where: { id: input.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.message !== undefined && { message: input.message }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
      ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
    },
  });

  // Broadcast update to all connected clients
  const now = new Date();
  const isActiveNow =
    announcement.isActive &&
    (!announcement.startsAt || announcement.startsAt <= now) &&
    (!announcement.endsAt || announcement.endsAt > now);

  if (isActiveNow) {
    await broadcastToChannel("announcements:global", "announcement_updated", {
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
    });
  } else {
    // If no longer active, broadcast deletion so clients remove it
    await broadcastToChannel("announcements:global", "announcement_deleted", {
      id: announcement.id,
    });
  }

  return announcement;
}
