import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { bustOnAnnouncementChanged } from "@/lib/services/cache";

/**
 * Delete an announcement and broadcast removal.
 */
export async function deleteAnnouncement(id: string) {
  const announcement = await prisma.announcement.delete({
    where: { id },
  });

  // Broadcast deletion to all connected clients
  await broadcastToChannel("announcements:global", "announcement_deleted", {
    id: announcement.id,
  });

  await bustOnAnnouncementChanged();

  return announcement;
}
