"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { getActiveAnnouncements } from "@/domain/announcement/operations/getActiveAnnouncements";

export async function fetchActiveAnnouncementsAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return getActiveAnnouncements(user.id);
}
